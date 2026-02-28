// =============================================================
// src/lib/agents/refiner.ts
// The Refiner Agent (Gemini Flash)
//
// JOB: Take raw, noisy message content and extract structured
// metadata. This is the FIRST AI stage after the Gatekeeper.
//
// INPUT: UniversalTask (normalized message from any platform)
//        UserPreferences (optional — tunes AI behavior per-user)
// OUTPUT: RefinerOutput (smart title, intent, priority, etc.)
//
// COST: Uses Gemini Flash — fast, cheap, high-volume.
// This runs on EVERY message that passes the Gatekeeper.
// =============================================================

import {
  RefinerOutputSchema,
  type RefinerOutput,
  type UniversalTask,
} from "@/lib/validators/schemas";
import { MODELS, generateEmbedding, generateJSON } from "./gemini";

// =============================================================
// USER PREFERENCES TYPE
// Subset of the full preferences relevant to the refiner.
// Passed from process-message after fetching from DB.
// =============================================================

export interface RefinerPreferences {
  urgentKeywords?: string[];
  intentPriorityMap?: Record<string, string>;
  noiseKeywords?: string[];
}

// =============================================================
// BASE SYSTEM PROMPT
// Core instructions — never changes.
// User preferences are appended dynamically per call.
// =============================================================

const BASE_REFINER_PROMPT = `You are the Refiner Agent for Nots.ai, a task management system that converts noisy multi-channel messages into structured tasks.

Your job is to analyze a raw message and extract structured metadata.

RULES:
1. Generate a concise "Smart Title" (3-15 words) that captures the core intent/action.
   - Bad: "Hey can you review the budget deck by Friday please thanks"
   - Good: "Review Q3 Budget Deck by Friday"
2. Classify the intent (e.g., "document-review", "bug-fix", "meeting-request", "task-assignment", "information-sharing", "approval-request", "question").
3. Extract any URLs/links mentioned in the text.
4. Extract any dates or deadlines mentioned (ISO 8601 format).
5. Extract mentioned usernames or email addresses.
6. Suggest a priority based on urgency signals:
   - CRITICAL: words like "urgent", "ASAP", "blocker", "outage", "down"
   - HIGH: words like "important", "deadline today", "EOD", "by tomorrow"
   - MEDIUM: standard work requests (default)
   - LOW: informational, FYI, no action needed
7. If the message is still noise that slipped past the Gatekeeper (e.g., automated notifications with no actionable content), set isNoise=true and explain why.
8. Rate your confidence in the extraction (0.0-1.0).

Respond ONLY with valid JSON matching this exact schema:
{
  "smartTitle": string,
  "intent": string,
  "extractedLinks": string[],
  "extractedDates": string[],
  "mentionedUsers": string[],
  "suggestedPriority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "isNoise": boolean,
  "noiseReason": string | undefined,
  "confidence": number
}`;

// =============================================================
// BUILD DYNAMIC SYSTEM PROMPT
// Appends user-specific tuning rules to the base prompt.
// This is what makes the AI tuneable via Settings.
// =============================================================

function buildSystemPrompt(prefs?: RefinerPreferences): string {
  if (!prefs) return BASE_REFINER_PROMPT;

  const additions: string[] = [];

  // Custom urgent keywords override the defaults
  if (prefs.urgentKeywords && prefs.urgentKeywords.length > 0) {
    additions.push(
      `\nUSER-DEFINED URGENCY KEYWORDS (treat these as CRITICAL priority triggers): ${prefs.urgentKeywords.join(", ")}`,
    );
  }

  // Intent → priority overrides
  if (
    prefs.intentPriorityMap &&
    Object.keys(prefs.intentPriorityMap).length > 0
  ) {
    const mappings = Object.entries(prefs.intentPriorityMap)
      .map(([intent, priority]) => `"${intent}" intent → ${priority}`)
      .join(", ");
    additions.push(
      `\nUSER-DEFINED INTENT PRIORITY RULES (override default priority for these intent types): ${mappings}`,
    );
  }

  // Custom noise keywords — mark as isNoise if content contains these
  if (prefs.noiseKeywords && prefs.noiseKeywords.length > 0) {
    additions.push(
      `\nUSER-DEFINED NOISE KEYWORDS (if the message ONLY contains these words with no other actionable content, set isNoise=true): ${prefs.noiseKeywords.join(", ")}`,
    );
  }

  if (additions.length === 0) return BASE_REFINER_PROMPT;

  return (
    BASE_REFINER_PROMPT + "\n\nUSER CUSTOMIZATIONS:" + additions.join("\n")
  );
}

// =============================================================
// REFINE
// Main entry point. Takes a UniversalTask and optional user
// preferences, returns RefinerOutput.
// =============================================================

export async function refine(
  task: UniversalTask,
  prefs?: RefinerPreferences,
): Promise<RefinerOutput> {
  const systemPrompt = buildSystemPrompt(prefs);
  const userPrompt = buildUserPrompt(task);

  try {
    const raw = await generateJSON<Record<string, unknown>>(
      MODELS.refiner,
      systemPrompt,
      userPrompt,
    );

    // Validate with Zod — if Gemini hallucinates, this catches it
    const parsed = RefinerOutputSchema.safeParse(raw);

    if (!parsed.success) {
      console.error(
        "[Refiner] Gemini output failed Zod validation:",
        parsed.error.flatten(),
      );
      return buildFallback(task);
    }

    return parsed.data;
  } catch (error) {
    // Gemini completely failed (timeout, rate limit, network error)
    // Return a usable fallback instead of crashing the pipeline
    console.error(
      "[Refiner] Gemini call failed, using fallback:",
      error instanceof Error ? error.message : error,
    );
    return buildFallback(task);
  }
}

/**
 * Build a safe fallback RefinerOutput when Gemini fails.
 * Uses the raw content as the title (truncated) and sets
 * low confidence so it gets flagged for human review.
 */
function buildFallback(task: UniversalTask): RefinerOutput {
  const firstSentence = task.rawContent.split(/[.!?\n]/)[0].trim();
  let title = firstSentence || task.rawContent;
  if (title.length > 80) {
    title = title.slice(0, 80);
    const lastSpace = title.lastIndexOf(" ");
    if (lastSpace > 20) title = title.slice(0, lastSpace);
    title += "…";
  }
  return {
    smartTitle: title,
    intent: "unknown",
    extractedLinks: [],
    extractedDates: [],
    mentionedUsers: [],
    suggestedPriority: "MEDIUM",
    isNoise: false,
    confidence: 0.3,
  };
}

// =============================================================
// REFINE WITH EMBEDDING
// Runs refine() AND generates the embedding in parallel.
// Accepts optional user preferences for AI tuning.
// =============================================================

export async function refineWithEmbedding(
  task: UniversalTask,
  prefs?: RefinerPreferences,
): Promise<{
  refinerOutput: RefinerOutput;
  embedding: number[];
}> {
  // Run both in parallel — no reason to wait sequentially
  const [refinerOutput, embedding] = await Promise.all([
    refine(task, prefs),
    generateEmbedding(task.rawContent),
  ]);

  return { refinerOutput, embedding };
}

// =============================================================
// BUILD USER PROMPT
// Formats the UniversalTask into a prompt string.
// =============================================================

function buildUserPrompt(task: UniversalTask): string {
  const parts = [
    `Platform: ${task.platform}`,
    `Sender: ${task.sender}`,
    `Timestamp: ${task.timestamp.toISOString()}`,
    `Content: ${task.rawContent}`,
  ];

  if (task.attachments.length > 0) {
    const attachList = task.attachments
      .map((a) => `  - ${a.name} (${a.mimeType ?? "unknown type"})`)
      .join("\n");
    parts.push(`Attachments:\n${attachList}`);
  }

  if (task.metadata) {
    parts.push(`Additional Metadata: ${JSON.stringify(task.metadata)}`);
  }

  return parts.join("\n");
}
