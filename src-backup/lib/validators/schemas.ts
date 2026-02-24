// =============================================================
// src/lib/validators/schemas.ts
// Zod Validation Layer for Nots.ai
//
// THREE BOUNDARIES VALIDATED:
//   1. INBOUND: Raw webhook payloads from Slack/Gmail/Jira.
//   2. AGENT OUTPUT: Structured responses from Gemini Flash/Pro.
//   3. DB WRITE: Final shape before Prisma insert/update.
//
// RULE: Nothing enters the database without passing through Zod.
// If Gemini hallucinates a field or Slack changes their payload
// shape, Zod catches it here — not as a runtime crash in prod.
//
// CHANGELOG v1.2:
// - Added threadId and channelId to UniversalTask + CreateSourceEvent
//   for deterministic merge (Stage 1: thread linking, Stage 2: sender+time)
// =============================================================

import { z } from "zod";

// =============================================================
// SHARED ENUMS
// Must match Prisma schema enums exactly.
// If you add a platform in schema.prisma, add it here too.
// =============================================================

export const PlatformEnum = z.enum([
  "SLACK",
  "GMAIL",
  "JIRA",
  "TRELLO",
  "ASANA",
  "MANUAL",
]);

export const PriorityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const TaskStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "ARCHIVED",
  "TRASHED",
]);

export type Platform = z.infer<typeof PlatformEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

// =============================================================
// BOUNDARY 1: INBOUND WEBHOOK PAYLOADS
// =============================================================

// --- Slack Event Payload ---
export const SlackEventSchema = z.object({
  type: z.literal("event_callback"),
  token: z.string().optional(),
  event: z.object({
    type: z.string(),
    user: z.string().min(1),
    text: z.string().default(""),
    channel: z.string().min(1),
    ts: z.string().min(1),
    thread_ts: z.string().optional(),
    files: z
      .array(
        z.object({
          name: z.string(),
          url_private: z.string().url(),
          mimetype: z.string().optional(),
          size: z.number().optional(),
        }),
      )
      .optional(),
  }),
  team_id: z.string().min(1),
  event_id: z.string().min(1),
});

export type SlackEvent = z.infer<typeof SlackEventSchema>;

// --- Gmail Pub/Sub Notification ---
export const GmailPubSubSchema = z.object({
  message: z.object({
    data: z.string().min(1),
    messageId: z.string().min(1),
    publishTime: z.string().datetime(),
  }),
  subscription: z.string().min(1),
});

export type GmailPubSub = z.infer<typeof GmailPubSubSchema>;

// --- Gmail Message (after API fetch) ---
export const GmailMessageSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  snippet: z.string().default(""),
  subject: z.string().default("(No Subject)"),
  from: z.string().min(1),
  date: z.string().min(1),
  body: z.string().default(""),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
        attachmentId: z.string(),
      }),
    )
    .default([]),
});

export type GmailMessage = z.infer<typeof GmailMessageSchema>;

// --- Jira Webhook ---
export const JiraWebhookSchema = z.object({
  webhookEvent: z.string().min(1),
  issue: z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    fields: z.object({
      summary: z.string().default(""),
      description: z.string().nullable().default(null),
      status: z.object({ name: z.string() }),
      priority: z.object({ name: z.string() }).optional(),
      assignee: z
        .object({ displayName: z.string(), emailAddress: z.string() })
        .nullable()
        .default(null),
      created: z.string(),
      updated: z.string(),
    }),
  }),
  user: z.object({
    displayName: z.string(),
    emailAddress: z.string(),
  }),
});

export type JiraWebhook = z.infer<typeof JiraWebhookSchema>;

// =============================================================
// UNIVERSAL TASK: Normalized format from any platform.
// Every connector converts its raw payload into this shape
// BEFORE hitting the Refiner agent.
//
// CHANGELOG v1.2:
// - Added threadId: Platform-native thread identifier.
//   Slack: thread_ts (shared by all replies in a thread)
//   Gmail: threadId (shared by all emails in a conversation)
// - Added channelId: Platform-native channel/context identifier.
//   Slack: channel ID. Gmail: not used (threadId suffices).
// =============================================================

export const UniversalTaskSchema = z.object({
  platform: PlatformEnum,
  rawContent: z
    .string()
    .min(1, "Content cannot be empty after noise filtering"),
  sender: z.string().min(1),
  deepLink: z.string().min(1),
  timestamp: z.coerce.date(),
  sourceHash: z.string().min(1, "Source hash is required for idempotency"),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        mimeType: z.string().optional(),
        size: z.number().int().positive().optional(),
      }),
    )
    .default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Thread/conversation ID for deterministic merge (Stage 1)
  threadId: z.string().optional(),
  // Channel/context ID for sender+time heuristic (Stage 2)
  channelId: z.string().optional(),
});

export type UniversalTask = z.infer<typeof UniversalTaskSchema>;

// =============================================================
// BOUNDARY 2: AGENT OUTPUT SCHEMAS
// =============================================================

// --- Refiner Agent Output (Gemini Flash) ---
export const RefinerOutputSchema = z.object({
  smartTitle: z
    .string()
    .min(3, "Title too short — Gemini likely returned garbage")
    .max(200, "Title too long — truncate or re-prompt"),
  intent: z.string().min(1).max(100),
  extractedLinks: z.array(z.string().url()).default([]),
  extractedDates: z.array(z.string()).default([]),
  mentionedUsers: z.array(z.string()).default([]),
  suggestedPriority: PriorityEnum.default("MEDIUM"),
  isNoise: z.boolean().default(false),
  noiseReason: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
});

export type RefinerOutput = z.infer<typeof RefinerOutputSchema>;

// --- Orchestrator Agent Output (Gemini Pro) ---
export const OrchestratorOutputSchema = z
  .object({
    action: z.enum(["MERGE", "CREATE", "REVIEW"]),
    mergeTargetId: z.string().optional(),
    similarityScore: z.number().min(0).max(1).optional(),
    confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
    newTaskTitle: z.string().optional(),
    reasoning: z.string().min(1),
  })
  .refine(
    (data) => {
      if (data.action === "MERGE" && !data.mergeTargetId) return false;
      return true;
    },
    { message: "MERGE action requires mergeTargetId" },
  )
  .refine(
    (data) => {
      if (data.action === "CREATE" && !data.newTaskTitle) return false;
      return true;
    },
    { message: "CREATE action requires newTaskTitle" },
  );

export type OrchestratorOutput = z.infer<typeof OrchestratorOutputSchema>;

// =============================================================
// BOUNDARY 3: DATABASE WRITE SCHEMAS
// =============================================================

// --- Create NodalTask ---
export const CreateNodalTaskSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().min(1).max(200),
  intent: z.string().max(100).optional(),
  priority: PriorityEnum.default("MEDIUM"),
  status: TaskStatusEnum.default("OPEN"),
  confidence: z.number().min(0).max(1).default(0),
  needsReview: z.boolean().default(false),
  embeddingModel: z.string().default("gemini-embedding-001"),
});

export type CreateNodalTask = z.infer<typeof CreateNodalTaskSchema>;

// --- Create SourceEvent ---
// CHANGELOG v1.2: Added threadId and channelId
export const CreateSourceEventSchema = z.object({
  platform: PlatformEnum,
  rawContent: z.string().min(1).max(10000),
  deepLink: z.string().min(1),
  sender: z.string().optional(),
  sourceHash: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.coerce.date(),
  threadId: z.string().optional(),
  channelId: z.string().optional(),
});

export type CreateSourceEvent = z.infer<typeof CreateSourceEventSchema>;

// --- Create TaskSourceLink ---
export const CreateTaskSourceLinkSchema = z.object({
  taskId: z.string().cuid(),
  eventId: z.string().cuid(),
  relevanceScore: z
    .number()
    .min(0)
    .max(1, "Relevance score must be between 0 and 1"),
  humanVerified: z.boolean().default(false),
});

export type CreateTaskSourceLink = z.infer<typeof CreateTaskSourceLinkSchema>;

// --- Dismiss TaskSourceLink (HITL action) ---
export const DismissLinkSchema = z.object({
  linkId: z.string().cuid(),
  dismissedBy: z.string().cuid(),
});

export type DismissLink = z.infer<typeof DismissLinkSchema>;

// --- Create Attachment ---
export const CreateAttachmentSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().optional(),
  size: z.number().int().positive().optional(),
});

export type CreateAttachment = z.infer<typeof CreateAttachmentSchema>;

// --- Update NodalTask (partial) ---
export const UpdateNodalTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  intent: z.string().max(100).optional(),
  priority: PriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  confidence: z.number().min(0).max(1).optional(),
  needsReview: z.boolean().optional(),
});

export type UpdateNodalTask = z.infer<typeof UpdateNodalTaskSchema>;

// =============================================================
// GATEKEEPER SCHEMAS
// =============================================================

export const GatekeeperResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.enum([
    "PASSED",
    "BOT_MESSAGE",
    "EMOJI_ONLY",
    "SHORT_NOISE",
    "DUPLICATE",
    "HMAC_FAILED",
  ]),
  sourceHash: z.string().optional(),
});

export type GatekeeperResult = z.infer<typeof GatekeeperResultSchema>;

// =============================================================
// HELPER: Safe parse wrapper
// =============================================================

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
