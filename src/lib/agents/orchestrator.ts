// =============================================================
// src/lib/agents/orchestrator.ts
// The Orchestrator Agent (Gemini Flash/Pro)
//
// JOB: Decide whether to MERGE a new message into an existing
// Nodal Task, CREATE a new task, or flag for REVIEW.
//
// DECISION FLOW:
//   1. Vector search: Find top-N similar existing tasks.
//   2. If best match > 0.85 similarity → MERGE candidate.
//   3. If multiple matches within 0.05 spread → REVIEW (ambiguous).
//   4. If no match > 0.85 → CREATE new task.
//   5. If confidence < 0.70 → REVIEW regardless.
//
// The Orchestrator uses BOTH vector similarity AND Gemini Pro
// reasoning to make the final call. Vector search narrows the
// candidates; Gemini confirms the semantic match.
// =============================================================

import {
  OrchestratorOutputSchema,
  type OrchestratorOutput,
  type RefinerOutput,
} from "@/lib/validators/schemas";
import {
  AMBIGUOUS_SPREAD_THRESHOLD,
  generateJSON,
  MODELS,
  REVIEW_CONFIDENCE_THRESHOLD,
  SIMILARITY_THRESHOLD,
} from "./gemini";

// =============================================================
// TYPES
// =============================================================

export interface VectorMatch {
  id: string;
  title: string;
  intent: string | null;
  similarity: number;
}

export interface OrchestratorInput {
  refinerOutput: RefinerOutput;
  rawContent: string;
  vectorMatches: VectorMatch[];
}

// =============================================================
// SYSTEM PROMPT
// =============================================================

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Orchestrator Agent for Nots.ai. Your job is to decide whether a new incoming message should be MERGED into an existing task, used to CREATE a new task, or flagged for human REVIEW.

You will receive:
1. The Refiner's extraction (smart title, intent, priority) for the new message.
2. A list of existing tasks with their similarity scores from vector search.

DECISION RULES:
- MERGE: The new message is CLEARLY about the SAME specific project, document, request, or conversation as an existing task. Both messages must reference the same concrete thing — not just the same general topic.
- CREATE: The new message represents a different task, even if it's in the same general domain. Two messages about different documents, different requests, or different projects are SEPARATE tasks.
- REVIEW: You are genuinely uncertain whether two items are the same task.

CRITICAL — DO NOT MERGE UNLESS:
- The messages reference the SAME specific document, project name, feature, or request.
- A score above 0.85 alone is NOT sufficient — you must verify the content is about the SAME thing.
- "Landing page wireframes" and "Q1 investor update" are DIFFERENT tasks even if both are "document review."
- "Database migration" and "API documentation" are DIFFERENT tasks even if both are "engineering."
- Same intent (e.g., both are "document-review") does NOT mean same task.

THRESHOLDS:
- Similarity > 0.90 AND content clearly matches → MERGE.
- Similarity 0.85–0.90 → MERGE only if the specific subject matter is identical.
- Similarity 0.80–0.85 → Almost always CREATE. Only MERGE if you are highly confident they reference the exact same thing.
- Similarity < 0.80 → Always CREATE.
- Top two matches within 0.05 spread → REVIEW.
- Your confidence < 0.70 → REVIEW regardless.

When choosing MERGE, set mergeTargetId to the exact ID string provided in the match list.
Always explain your reasoning.

Respond ONLY with valid JSON:
{
  "action": "MERGE" | "CREATE" | "REVIEW",
  "mergeTargetId": string | undefined,
  "similarityScore": number | undefined,
  "confidence": number,
  "newTaskTitle": string | undefined,
  "reasoning": string
}`;
// =============================================================
// ORCHESTRATE
// Main entry point. Takes Refiner output + vector matches,
// returns the grouping decision.
// =============================================================

export async function orchestrate(
  input: OrchestratorInput,
): Promise<OrchestratorOutput> {
  const { vectorMatches, refinerOutput } = input;

  // FAST PATH: No existing tasks → definitely CREATE
  if (vectorMatches.length === 0) {
    return {
      action: "CREATE",
      confidence: 0.95,
      newTaskTitle: refinerOutput.smartTitle,
      reasoning: "No existing tasks found. Creating new Nodal Task.",
    };
  }

  // FAST PATH: Check for ambiguous multi-match before calling Gemini
  const topMatch = vectorMatches[0];
  if (vectorMatches.length >= 2) {
    const secondMatch = vectorMatches[1];
    const spread = Math.abs(topMatch.similarity - secondMatch.similarity);

    if (
      topMatch.similarity >= SIMILARITY_THRESHOLD &&
      spread < AMBIGUOUS_SPREAD_THRESHOLD
    ) {
      return {
        action: "REVIEW",
        similarityScore: topMatch.similarity,
        confidence: 0.4,
        reasoning:
          `Ambiguous: Top two matches ("${topMatch.title}" at ${topMatch.similarity.toFixed(3)} ` +
          `and "${secondMatch.title}" at ${secondMatch.similarity.toFixed(3)}) ` +
          `are within ${AMBIGUOUS_SPREAD_THRESHOLD} spread. Human review needed.`,
      };
    }
  }

  // FAST PATH: Top match clearly below threshold → CREATE
  if (topMatch.similarity < SIMILARITY_THRESHOLD - 0.05) {
    return {
      action: "CREATE",
      confidence: 0.9,
      newTaskTitle: refinerOutput.smartTitle,
      reasoning:
        `Best match "${topMatch.title}" has similarity ${topMatch.similarity.toFixed(3)}, ` +
        `well below the ${SIMILARITY_THRESHOLD} threshold. Creating new task.`,
    };
  }

  // FAST PATH: Single clear match above threshold → MERGE
  if (
    topMatch.similarity >= SIMILARITY_THRESHOLD &&
    (vectorMatches.length === 1 ||
      vectorMatches[1].similarity < SIMILARITY_THRESHOLD)
  ) {
    return {
      action: "MERGE",
      mergeTargetId: topMatch.id,
      similarityScore: topMatch.similarity,
      confidence: Math.min(topMatch.similarity, 0.95),
      reasoning:
        `Clear match: "${topMatch.title}" at ${topMatch.similarity.toFixed(4)} ` +
        `exceeds the ${SIMILARITY_THRESHOLD} threshold with no competing matches.`,
    };
  }

  // SLOW PATH: Borderline cases → ask Gemini to reason about it
  const userPrompt = buildOrchestratorPrompt(input);

  const raw = await generateJSON<Record<string, unknown>>(
    MODELS.orchestrator,
    ORCHESTRATOR_SYSTEM_PROMPT,
    userPrompt,
  );

  const parsed = OrchestratorOutputSchema.safeParse(raw);

  if (!parsed.success) {
    console.error(
      "[Orchestrator] Gemini output failed Zod validation:",
      parsed.error.flatten(),
    );
    // Safe fallback: flag for review
    return {
      action: "REVIEW",
      confidence: 0.3,
      reasoning:
        "Orchestrator output failed validation. Flagging for human review.",
    };
  }

  // Override: If confidence is below threshold, force REVIEW
  if (parsed.data.confidence < REVIEW_CONFIDENCE_THRESHOLD) {
    return {
      ...parsed.data,
      action: "REVIEW",
      reasoning:
        parsed.data.reasoning +
        ` [Auto-flagged: confidence ${parsed.data.confidence} < ${REVIEW_CONFIDENCE_THRESHOLD} threshold]`,
    };
  }

  return parsed.data;
}

// =============================================================
// VECTOR SEARCH
// Queries pgvector for the top-N most similar existing tasks.
// This runs BEFORE the Orchestrator — it narrows candidates.
// =============================================================

export async function findSimilarTasks(
  embedding: number[],
  userId: string,
  db: {
    $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  },
  limit = 5,
): Promise<VectorMatch[]> {
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await db.$queryRawUnsafe<VectorMatch[]>(
    `SELECT
       id,
       title,
       intent,
       1 - (embedding <=> $1::vector) as similarity
     FROM nodal_tasks
WHERE embedding IS NOT NULL
       AND status NOT IN ('DONE', 'TRASHED', 'ARCHIVED')
       AND user_id = $2
            ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    userId,
    limit,
  );

  // pgvector returns numeric types as strings — normalize
  return results.map((r) => ({
    ...r,
    similarity: Number(r.similarity),
  }));
}

// =============================================================
// BUILD ORCHESTRATOR PROMPT
// =============================================================

function buildOrchestratorPrompt(input: OrchestratorInput): string {
  const { refinerOutput, rawContent, vectorMatches } = input;

  const matchList = vectorMatches
    .map(
      (m, i) =>
        `  ${i + 1}. ID: "${m.id}" | "${m.title}" (intent: ${m.intent ?? "unknown"}) — similarity: ${m.similarity.toFixed(4)}`,
    )
    .join("\n");

  return `NEW MESSAGE:
Title: "${refinerOutput.smartTitle}"
Intent: ${refinerOutput.intent}
Priority: ${refinerOutput.suggestedPriority}
Content: ${rawContent.slice(0, 500)}

EXISTING TASKS (ranked by vector similarity):
${matchList || "  (none)"}

SIMILARITY THRESHOLD: ${SIMILARITY_THRESHOLD}
REVIEW CONFIDENCE THRESHOLD: ${REVIEW_CONFIDENCE_THRESHOLD}

Based on the above, decide: MERGE, CREATE, or REVIEW?`;
}
