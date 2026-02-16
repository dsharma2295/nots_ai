// =============================================================
// src/app/api/tasks/update/route.ts
// Task mutation endpoint — executes AI-suggested actions
// AND direct user actions (hover buttons on task cards).
// =============================================================

import db from "@/lib/db";
import { PriorityEnum, TaskStatusEnum } from "@/lib/validators/schemas";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateTaskSchema = z.object({
  taskId: z.string().min(1),
  action: z.enum(["updateStatus", "updatePriority", "snooze"]),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
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

      return NextResponse.json({
        success: true,
        action: "updatePriority",
        taskId: data.taskId,
        priority: data.priority,
      });
    }

    // --- SNOOZE ---
    // For MVP, snooze just marks as ARCHIVED. A proper implementation
    // would use a snoozeUntil field + a cron job to unsnooze.
    if (data.action === "snooze") {
      await db.nodalTask.update({
        where: { id: data.taskId },
        data: { status: "ARCHIVED" },
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
