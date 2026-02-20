// =============================================================
// src/app/api/tasks/update/route.ts
// Task mutation endpoint — executes AI-suggested actions
// AND direct user actions (hover buttons on task cards).
// =============================================================

import db from "@/lib/db";
import { broadcastTaskUpdate } from "@/lib/supabase";
import { PriorityEnum, TaskStatusEnum } from "@/lib/validators/schemas";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const UpdateTaskSchema = z.object({
  taskId: z.string().min(1),
  action: z.enum([
    "updateStatus",
    "updatePriority",
    "updateTier",
    "bookmark",
    "markSeen",
    "snooze",
    "deleteTask", // soft delete → TRASHED
    "restoreFromTrash", // restore → OPEN
    "permanentDelete", // hard delete
    "emptyTrash", // hard delete all trashed,
  ]),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  tier: z.number().int().min(0).max(3).optional(),
  seenEventCount: z.number().int().min(0).optional(),
  snoozeUntil: z.string().optional(),
});

const CreateManualTaskSchema = z.object({
  action: z.literal("createTask"),
  title: z.string().min(1).max(200),
  intent: z.string().optional(),
  priority: PriorityEnum.optional(),
  deadline: z.string().optional(),
});

const RequestSchema = z.union([UpdateTaskSchema, CreateManualTaskSchema]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Quick check for emptyTrash (no taskId needed)
    if (body.action === "emptyTrash") {
      const trashed = await db.nodalTask.findMany({
        where: { status: "TRASHED" },
        select: { id: true },
      });
      const ids = trashed.map((t) => t.id);
      if (ids.length > 0) {
        // Find orphaned source events (only linked to trashed tasks)
        const exclusiveEvents = await db.$queryRawUnsafe<
          { event_id: string }[]
        >(
          `SELECT DISTINCT tsl.event_id FROM task_source_links tsl
           WHERE tsl.task_id = ANY($1::text[])
           AND NOT EXISTS (
             SELECT 1 FROM task_source_links other
             WHERE other.event_id = tsl.event_id
             AND other.task_id != ALL($1::text[])
           )`,
          ids,
        );
        const orphanEventIds = exclusiveEvents.map((e) => e.event_id);

        await db.note.deleteMany({ where: { taskId: { in: ids } } });
        await db.taskSourceLink.deleteMany({ where: { taskId: { in: ids } } });
        await db.nodalTask.deleteMany({ where: { id: { in: ids } } });

        if (orphanEventIds.length > 0) {
          await db.attachment.deleteMany({
            where: { eventId: { in: orphanEventIds } },
          });
          await db.sourceEvent.deleteMany({
            where: { id: { in: orphanEventIds } },
          });
        }
      }
      return NextResponse.json({
        success: true,
        action: "emptyTrash",
        count: ids.length,
      });
    }

    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // --- CREATE MANUAL TASK ---
    if (data.action === "createTask") {
      const targetEmail = process.env.GMAIL_TARGET_EMAIL;
      const user = targetEmail
        ? await db.user.findFirst({ where: { email: targetEmail } })
        : await db.user.findFirst();

      if (!user) {
        return NextResponse.json({ error: "No user found" }, { status: 404 });
      }

      const task = await db.nodalTask.create({
        data: {
          userId: user.id,
          title: data.title,
          intent: data.intent ?? "manual",
          priority: data.priority ?? "MEDIUM",
          status: "OPEN",
          confidence: 1.0,
          needsReview: false,
        },
      });
      await broadcastTaskUpdate({ type: "task_created", taskId: task.id });
      return NextResponse.json({
        success: true,
        action: "createTask",
        task: { id: task.id, title: task.title },
      });
    }
    // --- UPDATE STATUS ---
    if (data.action === "updateStatus" && data.status) {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { status: data.status },
      });

      return NextResponse.json({
        success: true,
        action: "updateStatus",
        taskId: data.taskId,
        status: data.status,
      });
    }

    // --- UPDATE PRIORITY ---
    if (data.action === "updatePriority" && data.priority) {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { priority: data.priority },
      });
      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { priority: data.priority },
      });
      return NextResponse.json({
        success: true,
        action: "updatePriority",
        taskId: data.taskId,
        priority: data.priority,
      });
    }

    // --- UPDATE TIER ---
    if (data.action === "updateTier" && data.tier !== undefined) {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { tier: data.tier },
      });
      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { tier: data.tier },
      });
      return NextResponse.json({
        success: true,
        action: "updateTier",
        taskId: data.taskId,
        tier: data.tier,
      });
    }

    // --- BOOKMARK ---
    if (data.action === "bookmark") {
      const task = await db.nodalTask.findUnique({
        where: { id: data.taskId },
      });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { bookmarked: !task.bookmarked },
      });

      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { bookmarked: !task.bookmarked },
      });

      return NextResponse.json({
        success: true,
        action: "bookmark",
        taskId: data.taskId,
        bookmarked: !task.bookmarked,
      });
    }
    // --- MARK SEEN ---
    if (data.action === "markSeen" && data.seenEventCount !== undefined) {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { seenEventCount: data.seenEventCount, hasBeenOpened: true },
      });
      return NextResponse.json({
        success: true,
        action: "markSeen",
        taskId: data.taskId,
        seenEventCount: data.seenEventCount,
      });
    }

    // --- SOFT DELETE (TRASH) ---
    if (data.action === "deleteTask") {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { status: "TRASHED", trashedAt: new Date() },
      });
      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { status: "TRASHED" },
      });
      return NextResponse.json({
        success: true,
        action: "deleteTask",
        taskId: data.taskId,
      });
    }
    // --- RESTORE FROM TRASH ---
    if (data.action === "restoreFromTrash") {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { status: "OPEN", trashedAt: null },
      });
      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { status: "OPEN" },
      });
      return NextResponse.json({
        success: true,
        action: "restoreFromTrash",
        taskId: data.taskId,
      });
    }

    // --- PERMANENT DELETE ---
    if (data.action === "permanentDelete") {
      // Get source event IDs linked only to this task
      const exclusiveEvents = await db.$queryRawUnsafe<{ event_id: string }[]>(
        `SELECT tsl.event_id FROM task_source_links tsl
         WHERE tsl.task_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM task_source_links other
           WHERE other.event_id = tsl.event_id
           AND other.task_id != $1
         )`,
        data.taskId,
      );
      const orphanEventIds = exclusiveEvents.map((e) => e.event_id);

      await db.note.deleteMany({ where: { taskId: data.taskId } });
      await db.taskSourceLink.deleteMany({ where: { taskId: data.taskId } });
      await db.nodalTask.delete({ where: { id: data.taskId } });

      // Clean orphaned source events and their attachments
      if (orphanEventIds.length > 0) {
        await db.attachment.deleteMany({
          where: { eventId: { in: orphanEventIds } },
        });
        await db.sourceEvent.deleteMany({
          where: { id: { in: orphanEventIds } },
        });
      }

      return NextResponse.json({
        success: true,
        action: "permanentDelete",
        taskId: data.taskId,
      });
    }
    // --- SNOOZE ---
    if (data.action === "snooze") {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { status: "ARCHIVED" },
      });
      await broadcastTaskUpdate({
        type: "task_updated",
        taskId: data.taskId,
        changes: { status: "ARCHIVED" },
      });
      return NextResponse.json({
        success: true,
        action: "snooze",
        taskId: data.taskId,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Task Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
