// =============================================================
// src/inngest/functions/process-message.ts
// The Core Pipeline — Inngest Durable Function
//
// This is the heart of Nots.ai. When a webhook arrives and
// passes the Gatekeeper, this function runs in the background.
//
// PIPELINE:
//   Step 1: Refine + Embed (parallel, Gemini Flash)
//   Step 2: Vector Search (find similar existing tasks)
//   Step 3: Orchestrate (decide MERGE / CREATE / REVIEW)
//   Step 4: Write to DB (create or link task + source event)
//
// WHY INNGEST: Each step is independently retryable.
// If Gemini times out on Step 1, Inngest retries just that
// step — it doesn't re-run the whole pipeline. This is
// critical for a zero-budget app hitting free-tier limits.
// =============================================================

import { findSimilarTasks, orchestrate } from "@/lib/agents/orchestrator";
import { refineWithEmbedding } from "@/lib/agents/refiner";
import db from "@/lib/db";
import {
  CreateNodalTaskSchema,
  CreateSourceEventSchema,
  CreateTaskSourceLinkSchema,
  UniversalTaskSchema,
  type UniversalTask,
} from "@/lib/validators/schemas";
import { inngest } from "../client";

// =============================================================
// EVENT SCHEMA
// This is the event shape that webhooks send to Inngest.
// =============================================================

export type ProcessMessageEvent = {
  name: "nots/message.received";
  data: {
    task: UniversalTask;
    userId: string;
  };
};

// =============================================================
// THE PIPELINE FUNCTION
// =============================================================

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    retries: 3,
    throttle: {
      // Rate limit: max 10 concurrent per user (protects free tier)
      key: "event.data.userId",
      limit: 10,
      period: "1m",
    },
  },
  { event: "nots/message.received" },
  async ({ event, step }) => {
    const { task, userId } = event.data;

    // Validate the incoming task one more time
    const validTask = UniversalTaskSchema.parse(task);

    // ---------------------------------------------------------
    // STEP 1: REFINE + EMBED (parallel)
    // Gemini Flash extracts metadata + generates embedding.
    // Both run concurrently — no reason to wait sequentially.
    // ---------------------------------------------------------
    const { refinerOutput, embedding } = await step.run(
      "refine-and-embed",
      async () => {
        const result = await refineWithEmbedding(validTask);

        // If the Refiner says it's noise, bail early
        if (result.refinerOutput.isNoise) {
          return { ...result, isNoise: true };
        }

        return { ...result, isNoise: false };
      },
    );

    // Early exit: Refiner caught noise the Gatekeeper missed
    if ("isNoise" in refinerOutput && refinerOutput.isNoise) {
      return {
        status: "NOISE_FILTERED",
        reason: refinerOutput.noiseReason ?? "Refiner classified as noise",
      };
    }

    // ---------------------------------------------------------
    // STEP 2: VECTOR SEARCH
    // Find top-5 existing tasks most similar to this message.
    // ---------------------------------------------------------
    const vectorMatches = await step.run("vector-search", async () => {
      return findSimilarTasks(embedding, userId, db);
    });

    // ---------------------------------------------------------
    // STEP 3: ORCHESTRATE
    // Decide: MERGE into existing task, CREATE new, or REVIEW.
    // ---------------------------------------------------------
    const decision = await step.run("orchestrate", async () => {
      return orchestrate({
        refinerOutput,
        rawContent: validTask.rawContent,
        vectorMatches,
      });
    });

    // ---------------------------------------------------------
    // STEP 4: WRITE TO DATABASE
    // Execute the Orchestrator's decision.
    // ---------------------------------------------------------
    const result = await step.run("write-to-db", async () => {
      // Create the SourceEvent first (it's needed for linking)
      const sourceEventData = CreateSourceEventSchema.parse({
        platform: validTask.platform,
        rawContent: validTask.rawContent,
        deepLink: validTask.deepLink,
        sender: validTask.sender,
        sourceHash: validTask.sourceHash,
        metadata: validTask.metadata,
        timestamp: validTask.timestamp,
      });

      const sourceEvent = await db.sourceEvent.create({
        data: sourceEventData,
      });

      // Create attachments if any
      if (validTask.attachments.length > 0) {
        await db.attachment.createMany({
          data: validTask.attachments.map((a) => ({
            eventId: sourceEvent.id,
            name: a.name,
            url: a.url,
            mimeType: a.mimeType,
            size: a.size,
          })),
        });
      }

      // --- MERGE ---
      if (decision.action === "MERGE" && decision.mergeTargetId) {
        const linkData = CreateTaskSourceLinkSchema.parse({
          taskId: decision.mergeTargetId,
          eventId: sourceEvent.id,
          relevanceScore: decision.similarityScore ?? decision.confidence,
        });

        await db.taskSourceLink.create({ data: linkData });

        // Update the task's embedding to include this new data
        // (rolling average would be better, but overwrite is fine for MVP)
        const vectorStr = `[${embedding.join(",")}]`;
        await db.$executeRawUnsafe(
          `UPDATE nodal_tasks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          vectorStr,
          decision.mergeTargetId,
        );

        return {
          status: "MERGED",
          taskId: decision.mergeTargetId,
          sourceEventId: sourceEvent.id,
          confidence: decision.confidence,
        };
      }

      // --- CREATE ---
      if (decision.action === "CREATE") {
        const taskData = CreateNodalTaskSchema.parse({
          userId,
          title: decision.newTaskTitle ?? refinerOutput.smartTitle,
          intent: refinerOutput.intent,
          priority: refinerOutput.suggestedPriority,
          confidence: decision.confidence,
          needsReview: false,
        });

        const nodalTask = await db.nodalTask.create({ data: taskData });

        // Store the embedding
        const vectorStr = `[${embedding.join(",")}]`;
        await db.$executeRawUnsafe(
          `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          nodalTask.id,
        );

        // Link the source event to the new task
        const linkData = CreateTaskSourceLinkSchema.parse({
          taskId: nodalTask.id,
          eventId: sourceEvent.id,
          relevanceScore: decision.confidence,
        });

        await db.taskSourceLink.create({ data: linkData });

        return {
          status: "CREATED",
          taskId: nodalTask.id,
          sourceEventId: sourceEvent.id,
          title: nodalTask.title,
        };
      }

      // --- REVIEW ---
      const taskData = CreateNodalTaskSchema.parse({
        userId,
        title: decision.newTaskTitle ?? refinerOutput.smartTitle,
        intent: refinerOutput.intent,
        priority: refinerOutput.suggestedPriority,
        confidence: decision.confidence,
        needsReview: true,
      });

      const nodalTask = await db.nodalTask.create({ data: taskData });

      const vectorStr = `[${embedding.join(",")}]`;
      await db.$executeRawUnsafe(
        `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        nodalTask.id,
      );

      // Link to new task + any ambiguous existing tasks
      const linkData = CreateTaskSourceLinkSchema.parse({
        taskId: nodalTask.id,
        eventId: sourceEvent.id,
        relevanceScore: decision.confidence,
      });

      await db.taskSourceLink.create({ data: linkData });

      // If there were ambiguous matches, create links to those too
      if (vectorMatches.length > 0) {
        for (const match of vectorMatches.filter((m) => m.similarity >= 0.75)) {
          const ambiguousLink = CreateTaskSourceLinkSchema.parse({
            taskId: match.id,
            eventId: sourceEvent.id,
            relevanceScore: match.similarity,
          });
          await db.taskSourceLink.create({ data: ambiguousLink });
        }
      }

      return {
        status: "REVIEW",
        taskId: nodalTask.id,
        sourceEventId: sourceEvent.id,
        reasoning: decision.reasoning,
      };
    });

    return result;
  },
);
