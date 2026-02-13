// =============================================================
// src/lib/agents/refiner.ts
// The Refiner Agent (Gemini Flash)
//
// JOB: Take raw, noisy message content and extract structured
// metadata. This is the FIRST AI stage after the Gatekeeper.
//
// INPUT: UniversalTask (normalized message from any platform)
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
// SYSTEM PROMPT
// This is the "brain" of the Refiner. It tells Gemini exactly
// what to extract and how to format it.
// =============================================================

const REFINER_SYSTEM_PROMPT = `You are the Refiner Agent for Nots.ai, a task management system that converts noisy multi-channel messages into structured tasks.

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
// REFINE
// Main entry point. Takes a UniversalTask, returns RefinerOutput.
// =============================================================

export async function refine(task: UniversalTask): Promise<RefinerOutput> {
  const userPrompt = buildUserPrompt(task);

  try {
    const raw = await generateJSON<Record<string, unknown>>(
      MODELS.refiner,
      REFINER_SYSTEM_PROMPT,
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
  // Try to extract a reasonable title from the first sentence
  const firstSentence = task.rawContent
    .split(/[.!?\n]/)[0]
    .trim()
    .slice(0, 100);

  return {
    smartTitle: firstSentence || task.rawContent.slice(0, 100),
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
// This is what the Inngest function calls — both operations
// happen concurrently to minimize latency.
// =============================================================

export async function refineWithEmbedding(task: UniversalTask): Promise<{
  refinerOutput: RefinerOutput;
  embedding: number[];
}> {
  // Run both in parallel — no reason to wait sequentially
  const [refinerOutput, embedding] = await Promise.all([
    refine(task),
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
