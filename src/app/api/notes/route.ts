// =============================================================
// src/app/api/notes/route.ts
// Notes CRUD — create, list, update notes on nodal tasks
// =============================================================

import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type NoteWithSource = {
  id: string;
  taskId: string;
  title: string | null;
  content: string;
  sourceEventId: string | null;
  sourceEvent: {
    id: string;
    platform: string;
    sender: string | null;
    rawContent: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

const CreateNoteSchema = z.object({
  action: z.literal("create"),
  taskId: z.string().min(1),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  sourceEventId: z.string().optional(),
});

const UpdateNoteSchema = z.object({
  action: z.literal("update"),
  noteId: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(5000),
});

const ListNotesSchema = z.object({
  action: z.literal("list"),
  taskId: z.string().min(1),
});

const DeleteNoteSchema = z.object({
  action: z.literal("delete"),
  noteId: z.string().min(1),
});

const RequestSchema = z.union([
  CreateNoteSchema,
  UpdateNoteSchema,
  ListNotesSchema,
  DeleteNoteSchema,
]);

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

    // --- CREATE ---
    if (data.action === "create") {
      // Generate a cuid-like ID
      const note = await db.note.create({
        data: {
          taskId: data.taskId,
          title: data.title || null,
          content: data.content,
          sourceEventId: data.sourceEventId || null,
        },
        include: {
          sourceEvent: {
            select: {
              id: true,
              platform: true,
              sender: true,
              rawContent: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: "create",
        note: {
          id: note.id,
          taskId: note.taskId,
          title: note.title,
          content: note.content,
          sourceEventId: note.sourceEventId,
          sourceEvent: note.sourceEvent
            ? {
                id: note.sourceEvent.id,
                platform: note.sourceEvent.platform,
                sender: note.sourceEvent.sender,
                rawContent: note.sourceEvent.rawContent.slice(0, 80),
              }
            : null,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      });
    }

    // --- UPDATE ---
    if (data.action === "update") {
      const note = await db.note.update({
        where: { id: data.noteId },
        data: {
          title: data.title === null ? null : data.title,
          content: data.content,
        },
        include: {
          sourceEvent: {
            select: {
              id: true,
              platform: true,
              sender: true,
              rawContent: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: "update",
        note: {
          id: note.id,
          taskId: note.taskId,
          title: note.title,
          content: note.content,
          sourceEventId: note.sourceEventId,
          sourceEvent: note.sourceEvent
            ? {
                id: note.sourceEvent.id,
                platform: note.sourceEvent.platform,
                sender: note.sourceEvent.sender,
                rawContent: note.sourceEvent.rawContent.slice(0, 80),
              }
            : null,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      });
    }

    // --- LIST ---
    if (data.action === "list") {
      const notes = await db.note.findMany({
        where: { taskId: data.taskId },
        orderBy: { createdAt: "desc" },
        include: {
          sourceEvent: {
            select: {
              id: true,
              platform: true,
              sender: true,
              rawContent: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        notes: notes.map((n: NoteWithSource) => ({
          id: n.id,
          taskId: n.taskId,
          title: n.title,
          content: n.content,
          sourceEventId: n.sourceEventId,
          sourceEvent: n.sourceEvent
            ? {
                id: n.sourceEvent.id,
                platform: n.sourceEvent.platform,
                sender: n.sourceEvent.sender,
                rawContent: n.sourceEvent.rawContent.slice(0, 80),
              }
            : null,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        })),
      });
    }

    // --- DELETE ---
    if (data.action === "delete") {
      await db.note.delete({
        where: { id: data.noteId },
      });

      return NextResponse.json({
        success: true,
        action: "delete",
        noteId: data.noteId,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Notes API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process note" },
      { status: 500 },
    );
  }
}
