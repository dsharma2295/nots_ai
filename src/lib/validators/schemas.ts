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
]);

export type Platform = z.infer<typeof PlatformEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

// =============================================================
// BOUNDARY 1: INBOUND WEBHOOK PAYLOADS
// Raw data from external platforms. These are the most
// dangerous — external services can change schemas anytime.
// =============================================================

// --- Slack Event Payload ---
// Slack sends this via Events API / Socket Mode.
// We only extract what we need — ignore the rest.
export const SlackEventSchema = z.object({
  type: z.literal("event_callback"),
  token: z.string().optional(),
  event: z.object({
    type: z.string(),
    user: z.string().min(1),
    text: z.string().default(""),
    channel: z.string().min(1),
    ts: z.string().min(1), // Slack timestamp (e.g. "1234567890.123456")
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
// Google Cloud Pub/Sub pushes this when a new email arrives.
// The actual email content requires a separate Gmail API call.
export const GmailPubSubSchema = z.object({
  message: z.object({
    data: z.string().min(1), // Base64-encoded JSON
    messageId: z.string().min(1),
    publishTime: z.string().datetime(),
  }),
  subscription: z.string().min(1),
});

export type GmailPubSub = z.infer<typeof GmailPubSubSchema>;

// --- Gmail Message (after API fetch) ---
// Decoded email content from Gmail API.
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
    key: z.string().min(1), // e.g. "PROJ-123"
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
// Every connector (Slack, Gmail, Jira) converts its raw payload
// into this shape BEFORE hitting the Refiner agent.
// This is the single contract the AI sees.
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
});

export type UniversalTask = z.infer<typeof UniversalTaskSchema>;

// =============================================================
// BOUNDARY 2: AGENT OUTPUT SCHEMAS
// Gemini Flash/Pro return JSON. These schemas enforce the exact
// shape we expect. If Gemini hallucinates an extra field or
// returns a string where we need a number, Zod rejects it.
// =============================================================

// --- Refiner Agent Output (Gemini Flash) ---
// Extracts metadata and generates a "Smart Title" from raw content.
export const RefinerOutputSchema = z.object({
  smartTitle: z
    .string()
    .min(3, "Title too short — Gemini likely returned garbage")
    .max(200, "Title too long — truncate or re-prompt"),
  intent: z.string().min(1).max(100),
  extractedLinks: z.array(z.string().url()).default([]),
  extractedDates: z.array(z.coerce.date()).default([]),
  mentionedUsers: z.array(z.string()).default([]),
  suggestedPriority: PriorityEnum.default("MEDIUM"),
  isNoise: z.boolean().default(false),
  noiseReason: z.string().optional(),
  confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
});

export type RefinerOutput = z.infer<typeof RefinerOutputSchema>;

// --- Orchestrator Agent Output (Gemini Pro) ---
// Decides whether to merge into existing task or create new.
export const OrchestratorOutputSchema = z
  .object({
    action: z.enum(["MERGE", "CREATE", "REVIEW"]),
    // If MERGE: which existing task to merge into
    mergeTargetId: z.string().optional(),
    // Cosine similarity score that led to this decision
    similarityScore: z.number().min(0).max(1).optional(),
    // Overall confidence in the grouping decision
    confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
    // If CREATE: suggested title for the new task
    newTaskTitle: z.string().optional(),
    // Reasoning — useful for HITL review and debugging
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
// Final validation before Prisma insert. These map directly
// to Prisma's create/update input types.
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
  embeddingModel: z.string().default("gemini-text-embedding-004"),
});

export type CreateNodalTask = z.infer<typeof CreateNodalTaskSchema>;

// --- Create SourceEvent ---
export const CreateSourceEventSchema = z.object({
  platform: PlatformEnum,
  rawContent: z.string().min(1).max(10000),
  deepLink: z.string().min(1),
  sender: z.string().optional(),
  sourceHash: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.coerce.date(),
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
// Used by the noise filter to classify incoming messages
// before they reach the AI pipeline.
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
// Returns typed result instead of throwing.
// Use this everywhere instead of .parse() directly.
//
// USAGE:
//   const result = safeParse(UniversalTaskSchema, rawData);
//   if (!result.success) {
//     console.error(result.error.flatten());
//     return;
//   }
//   // result.data is fully typed
// =============================================================

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
