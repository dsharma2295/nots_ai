// =============================================================
// src/inngest/functions/process-message.ts
// The Core Pipeline — Inngest Durable Function
//
// PIPELINE (Cascading Merge — Approach 2):
//   Stage 0: Validate + check for noise-in-thread (Option B)
//   Stage 1: Thread Match (deterministic — zero AI cost)
//   Stage 2: Sender + Time + Channel (heuristic — zero AI cost)
//   Stage 3: Refine + Embed + Vector Search + Orchestrate (AI)
//   Stage 4: Write to DB
//
// Messages caught by Stage 1 or 2 skip all AI calls.
// =============================================================

import { findSimilarTasks, orchestrate } from "@/lib/agents/orchestrator";
import { refineWithEmbedding } from "@/lib/agents/refiner";
import db from "@/lib/db";
import { broadcastTaskUpdate } from "@/lib/supabase";
import {
  CreateNodalTaskSchema,
  CreateSourceEventSchema,
  CreateTaskSourceLinkSchema,
  UniversalTaskSchema,
  type UniversalTask,
} from "@/lib/validators/schemas";
import { inngest } from "../client";

// =============================================================
// CONSTANTS
// =============================================================

const STAGE_2_TIME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const STAGE_2_LOWERED_THRESHOLD = 0.75;

// =============================================================
// EVENT SCHEMA
// =============================================================

export type ProcessMessageEvent = {
  name: "nots/message.received";
  data: {
    task: UniversalTask;
    userId: string;
  };
};

// =============================================================
// STAGE 1: THREAD MATCH (Deterministic)
// Look for existing SourceEvents with the same threadId.
// If found, merge into the same NodalTask — no AI needed.
// =============================================================

async function findThreadMatch(
  threadId: string | undefined,
  platform: string,
): Promise<string | null> {
  if (!threadId) return null;

  // Find a SourceEvent with the same threadId and platform
  const existing = await db.sourceEvent.findFirst({
    where: {
      threadId,
      platform: platform as
        | "SLACK"
        | "GMAIL"
        | "JIRA"
        | "TRELLO"
        | "ASANA"
        | "MANUAL",
    },
    include: {
      taskLinks: {
        where: { dismissed: false },
        select: { taskId: true },
        take: 1,
      },
    },
    orderBy: { timestamp: "desc" },
  });

  if (existing && existing.taskLinks.length > 0) {
    return existing.taskLinks[0].taskId;
  }

  return null;
}

// =============================================================
// STAGE 2: SENDER + TIME + CHANNEL (Heuristic)
// Same sender, same channel, within 30 minutes.
// Returns the taskId if found, null otherwise.
// The caller must still run semantic similarity at a lowered
// threshold (0.60) to avoid false merges.
// =============================================================

async function findSenderTimeMatch(
  sender: string,
  channelId: string | undefined,
  timestamp: Date,
  platform: string,
): Promise<string | null> {
  if (!channelId) return null;

  const windowStart = new Date(timestamp.getTime() - STAGE_2_TIME_WINDOW_MS);

  const recent = await db.sourceEvent.findFirst({
    where: {
      sender,
      channelId,
      platform: platform as
        | "SLACK"
        | "GMAIL"
        | "JIRA"
        | "TRELLO"
        | "ASANA"
        | "MANUAL",
      timestamp: { gte: windowStart },
    },
    include: {
      taskLinks: {
        where: { dismissed: false },
        select: { taskId: true },
        take: 1,
      },
    },
    orderBy: { timestamp: "desc" },
  });

  if (recent && recent.taskLinks.length > 0) {
    return recent.taskLinks[0].taskId;
  }

  return null;
}

// =============================================================
// THE PIPELINE FUNCTION
// =============================================================

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    retries: 3,
    concurrency: [
      {
        // Process one message at a time per user (prevents E14 race condition)
        scope: "fn",
        key: "event.data.userId",
        limit: 1,
      },
    ],
    throttle: {
      key: "event.data.userId",
      limit: 10,
      period: "1m",
    },
  },
  { event: "nots/message.received" },
  async ({ event, step }) => {
    const { task, userId } = event.data;
    const validTask = UniversalTaskSchema.parse(task);

    // ─────────────────────────────────────────────────────
    // STAGE 0: NOISE-IN-THREAD (Option B)
    // If the message was flagged as noise but has a threadId,
    // just touch the task's updatedAt without adding to provenance.
    // ─────────────────────────────────────────────────────
    const isNoiseInThread =
      validTask.metadata &&
      (validTask.metadata as Record<string, unknown>).noiseInThread === true;

    if (isNoiseInThread) {
      const touchResult = await step.run("noise-thread-touch", async () => {
        const taskId = await findThreadMatch(
          validTask.threadId,
          validTask.platform,
        );
        if (taskId) {
          await db.nodalTask.update({
            where: { id: taskId },
            data: { updatedAt: new Date() },
          });
          await broadcastTaskUpdate({ type: "task_updated", taskId });
          return { status: "NOISE_THREAD_TOUCHED", taskId };
        }
        return { status: "NOISE_NO_THREAD_MATCH" };
      });
      return touchResult;
    }

    // ─────────────────────────────────────────────────────
    // STAGE 1: THREAD MATCH (Deterministic)
    // Zero AI cost. If threadId matches, merge immediately.
    // ─────────────────────────────────────────────────────
    const threadMergeTaskId = await step.run(
      "stage1-thread-match",
      async () => {
        return findThreadMatch(validTask.threadId, validTask.platform);
      },
    );

    if (threadMergeTaskId) {
      // Thread match found — skip all AI, go straight to DB write
      const result = await step.run("stage1-write-to-db", async () => {
        const sourceEventData = CreateSourceEventSchema.parse({
          platform: validTask.platform,
          rawContent: validTask.rawContent,
          deepLink: validTask.deepLink,
          sender: validTask.sender,
          sourceHash: validTask.sourceHash,
          metadata: validTask.metadata,
          timestamp: validTask.timestamp,
          threadId: validTask.threadId,
          channelId: validTask.channelId,
        });

        const sourceEvent = await db.sourceEvent.create({
          data: sourceEventData,
        });

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

        const linkData = CreateTaskSourceLinkSchema.parse({
          taskId: threadMergeTaskId,
          eventId: sourceEvent.id,
          relevanceScore: 1.0, // Deterministic match = perfect confidence
        });

        await db.taskSourceLink.create({ data: linkData });

        // Touch updatedAt so dashboard shows this task as recently active
        await db.nodalTask.update({
          where: { id: threadMergeTaskId },
          data: { updatedAt: new Date() },
        });

        await broadcastTaskUpdate({
          type: "task_updated",
          taskId: threadMergeTaskId,
        });

        return {
          status: "MERGED_VIA_THREAD",
          taskId: threadMergeTaskId,
          sourceEventId: sourceEvent.id,
          stage: 1,
        };
      });

      return result;
    }

    // ─────────────────────────────────────────────────────
    // STAGE 3A: REFINE + EMBED
    // No thread match — need AI to process the content.
    // This runs regardless of whether Stage 2 will match.
    // ─────────────────────────────────────────────────────
    const { refinerOutput, embedding } = await step.run(
      "refine-and-embed",
      async () => {
        const result = await refineWithEmbedding(validTask);
        if (result.refinerOutput.isNoise) {
          return { ...result, isNoise: true };
        }
        return { ...result, isNoise: false };
      },
    );

    if ("isNoise" in refinerOutput && refinerOutput.isNoise) {
      return {
        status: "NOISE_FILTERED",
        reason: refinerOutput.noiseReason ?? "Refiner classified as noise",
      };
    }

    // ─────────────────────────────────────────────────────
    // STAGE 2: SENDER + TIME + CHANNEL (Heuristic)
    // Same sender, same channel, within 30 min.
    // If found, verify with semantic similarity at lowered
    // threshold (0.60) to prevent false merges.
    // ─────────────────────────────────────────────────────
    const stage2Result = await step.run("stage2-sender-time", async () => {
      const candidateTaskId = await findSenderTimeMatch(
        validTask.sender,
        validTask.channelId,
        validTask.timestamp,
        validTask.platform,
      );

      if (!candidateTaskId) return null;

      // Verify with semantic similarity at lowered threshold
      const vectorStr = `[${embedding.join(",")}]`;
      const verification = await db.$queryRawUnsafe<{ similarity: number }[]>(
        `SELECT 1 - (embedding <=> $1::vector) as similarity
         FROM nodal_tasks
         WHERE id = $2
           AND embedding IS NOT NULL`,
        vectorStr,
        candidateTaskId,
      );

      if (
        verification.length > 0 &&
        Number(verification[0].similarity) >= STAGE_2_LOWERED_THRESHOLD
      ) {
        return {
          taskId: candidateTaskId,
          similarity: Number(verification[0].similarity),
        };
      }

      return null;
    });

    if (stage2Result) {
      // Stage 2 match confirmed — merge
      const result = await step.run("stage2-write-to-db", async () => {
        const sourceEventData = CreateSourceEventSchema.parse({
          platform: validTask.platform,
          rawContent: validTask.rawContent,
          deepLink: validTask.deepLink,
          sender: validTask.sender,
          sourceHash: validTask.sourceHash,
          metadata: validTask.metadata,
          timestamp: validTask.timestamp,
          threadId: validTask.threadId,
          channelId: validTask.channelId,
        });

        const sourceEvent = await db.sourceEvent.create({
          data: sourceEventData,
        });

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

        const linkData = CreateTaskSourceLinkSchema.parse({
          taskId: stage2Result.taskId,
          eventId: sourceEvent.id,
          relevanceScore: stage2Result.similarity,
        });

        await db.taskSourceLink.create({ data: linkData });

        // Update embedding (rolling average would be better — overwrite for MVP)
        const vectorStr = `[${embedding.join(",")}]`;
        await db.$executeRawUnsafe(
          `UPDATE nodal_tasks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          vectorStr,
          stage2Result.taskId,
        );

        await broadcastTaskUpdate({
          type: "task_updated",
          taskId: stage2Result.taskId,
        });

        return {
          status: "MERGED_VIA_SENDER_TIME",
          taskId: stage2Result.taskId,
          sourceEventId: sourceEvent.id,
          similarity: stage2Result.similarity,
          stage: 2,
        };
      });

      return result;
    }

    // ─────────────────────────────────────────────────────
    // STAGE 3B: VECTOR SEARCH + ORCHESTRATE
    // Full AI pipeline — existing logic unchanged.
    // ─────────────────────────────────────────────────────
    const vectorMatches = await step.run("vector-search", async () => {
      return findSimilarTasks(embedding, userId, db);
    });

    const decision = await step.run("orchestrate", async () => {
      return orchestrate({
        refinerOutput,
        rawContent: validTask.rawContent,
        vectorMatches,
      });
    });

    // ─────────────────────────────────────────────────────
    // STAGE 4: WRITE TO DATABASE
    // Now includes threadId and channelId on SourceEvent.
    // ─────────────────────────────────────────────────────
    const result = await step.run("write-to-db", async () => {
      const sourceEventData = CreateSourceEventSchema.parse({
        platform: validTask.platform,
        rawContent: validTask.rawContent,
        deepLink: validTask.deepLink,
        sender: validTask.sender,
        sourceHash: validTask.sourceHash,
        metadata: validTask.metadata,
        timestamp: validTask.timestamp,
        threadId: validTask.threadId,
        channelId: validTask.channelId,
      });

      const sourceEvent = await db.sourceEvent.create({
        data: sourceEventData,
      });

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

        const vectorStr = `[${embedding.join(",")}]`;
        await db.$executeRawUnsafe(
          `UPDATE nodal_tasks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
          vectorStr,
          decision.mergeTargetId,
        );

        await broadcastTaskUpdate({
          type: "task_updated",
          taskId: decision.mergeTargetId,
        });

        return {
          status: "MERGED",
          taskId: decision.mergeTargetId,
          sourceEventId: sourceEvent.id,
          confidence: decision.confidence,
          stage: 3,
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

        const vectorStr = `[${embedding.join(",")}]`;
        await db.$executeRawUnsafe(
          `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          nodalTask.id,
        );

        const linkData = CreateTaskSourceLinkSchema.parse({
          taskId: nodalTask.id,
          eventId: sourceEvent.id,
          relevanceScore: decision.confidence,
        });

        await db.taskSourceLink.create({ data: linkData });

        await broadcastTaskUpdate({
          type: "task_created",
          taskId: nodalTask.id,
        });

        return {
          status: "CREATED",
          taskId: nodalTask.id,
          sourceEventId: sourceEvent.id,
          title: nodalTask.title,
          stage: 3,
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

      const linkData = CreateTaskSourceLinkSchema.parse({
        taskId: nodalTask.id,
        eventId: sourceEvent.id,
        relevanceScore: decision.confidence,
      });

      await db.taskSourceLink.create({ data: linkData });

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

      await broadcastTaskUpdate({
        type: "task_created",
        taskId: nodalTask.id,
      });

      return {
        status: "REVIEW",
        taskId: nodalTask.id,
        sourceEventId: sourceEvent.id,
        reasoning: decision.reasoning,
        stage: 3,
      };
    });

    return result;
  },
);
