// =============================================================
// src/app/api/ai/query/route.ts
// AI Search endpoint — reads tasks, builds context, calls Gemini.
//
// This is a READ-HEAVY endpoint. It fetches all user tasks,
// serializes them as context for Gemini, and returns a natural
// language response with optional structured actions.
//
// COST: 1 Gemini call per query (~500-800 input tokens).
// =============================================================

import { generateJSON, MODELS } from "@/lib/agents/gemini";
import db from "@/lib/db";
import {
  AIQueryRequestSchema,
  AIQueryResponseSchema,
  type AIQueryResponse,
} from "@/lib/validators/ai-query";
import { NextRequest, NextResponse } from "next/server";

// =============================================================
// SYSTEM PROMPT
// =============================================================

const AI_SEARCH_SYSTEM_PROMPT = `You are the AI assistant for Nots.ai, a personal command center that aggregates tasks from Slack, Gmail, and Jira into unified task cards.

You have access to the user's complete task list with all source events (messages/emails/tickets that created each task).

CAPABILITIES:
1. SUMMARIZE: Provide briefings about tasks (today, this week, by priority, by platform).
2. ANALYZE: Find relationships between tasks, identify blockers, find stale/duplicate tasks.
3. SEARCH: Find tasks by sender, platform, content, date range, or any natural language query.
4. CREATE: Help create new manual tasks when the user says "add" or "create" or "remind me".
5. MODIFY: Help change task status (mark done, reopen) or priority when the user requests it.
6. BRIEF: Give quick "morning briefing" style summaries of what needs attention.

RESPONSE FORMAT — Always respond with valid JSON matching this exact schema:
{
  "text": "Your natural language response to the user. Use markdown for formatting. Be concise but thorough.",
  "actions": [
    // Optional array of structured actions. Include ONLY when the user explicitly asks to create, update, or modify tasks.
    // Action types:
    // { "type": "updateStatus", "taskId": "exact-id", "status": "DONE" | "OPEN" | "IN_PROGRESS" | "BLOCKED" | "ARCHIVED" }
    // { "type": "updatePriority", "taskId": "exact-id", "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" }
    // { "type": "createTask", "title": "Task title", "intent": "task-type", "priority": "MEDIUM", "deadline": "2026-02-20" }
    // { "type": "snoozeTask", "taskId": "exact-id", "until": "2026-02-20" }
  ],
  "queryType": "summary" | "analysis" | "search" | "creation" | "modification" | "briefing",
  "referencedTaskIds": ["id1", "id2"]  // IDs of tasks you mention in your response
}

RULES:
- Be concise. No fluff. Users want fast answers.
- When referencing tasks, use their exact titles in bold.
- When suggesting actions, include them in the actions array so the UI can render confirm buttons.
- For time-based queries, use the current date provided in the context.
- If you can't answer the query from the available data, say so clearly.
- Never make up task data that doesn't exist in the context.
- For "morning briefing" or "summarize today", prioritize: urgent items first, then blocked, then new items.
- Format lists with bullet points using markdown.`;

// =============================================================
// HANDLER
// =============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AIQueryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { query } = parsed.data;

    // Get the user — use the primary email
    const targetEmail = process.env.GMAIL_TARGET_EMAIL;
    const user = targetEmail
      ? await db.user.findFirst({ where: { email: targetEmail } })
      : await db.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    // Fetch all tasks with source events
    const tasks = await db.nodalTask.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        sourceLinks: {
          where: { dismissed: false },
          include: {
            event: {
              include: { attachments: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Build context string
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    const taskContext = tasks
      .map((t, i) => {
        const sources = t.sourceLinks
          .map(
            (sl) =>
              `    - [${sl.event.platform}] From: ${sl.event.sender ?? "Unknown"} | ${sl.event.rawContent.slice(0, 200)} | ${sl.event.timestamp.toISOString()}${
                sl.event.attachments.length > 0 ? "" : ""
              }`,
          )
          .join("\n");

        return `${i + 1}. [ID: ${t.id}] "${t.title}"
   Priority: ${t.priority} | Status: ${t.status} | Intent: ${t.intent ?? "unknown"}
   Confidence: ${t.confidence} | Needs Review: ${t.needsReview}
   Created: ${t.createdAt.toISOString()} | Updated: ${t.updatedAt.toISOString()}
   Sources (${t.sourceLinks.length}):
${sources}`;
      })
      .join("\n\n");

    // Stats
    const openCount = tasks.filter((t) => t.status === "OPEN").length;
    const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
    const doneCount = tasks.filter((t) => t.status === "DONE").length;
    const reviewCount = tasks.filter((t) => t.needsReview).length;
    const criticalCount = tasks.filter((t) => t.priority === "CRITICAL").length;
    const highCount = tasks.filter((t) => t.priority === "HIGH").length;

    const userPrompt = `CURRENT DATE: ${today} (${dayOfWeek})
TOTAL TASKS: ${tasks.length} (${openCount} open, ${blockedCount} blocked, ${doneCount} done, ${reviewCount} need review)
PRIORITY BREAKDOWN: ${criticalCount} critical, ${highCount} high

USER QUERY: ${query}

TASK DATA:
${taskContext || "(No tasks found)"}`;

    // Call Gemini
    const raw = await generateJSON<Record<string, unknown>>(
      MODELS.orchestrator,
      AI_SEARCH_SYSTEM_PROMPT,
      userPrompt,
    );

    // Validate response
    const response = AIQueryResponseSchema.safeParse(raw);

    if (!response.success) {
      // Fallback: treat raw text as the response
      const fallbackText =
        typeof raw === "object" && raw !== null && "text" in raw
          ? String(raw.text)
          : "I processed your query but couldn't format the response properly. Please try rephrasing.";

      return NextResponse.json({
        text: fallbackText,
        actions: [],
        queryType: "summary",
        referencedTaskIds: [],
      } satisfies AIQueryResponse);
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[AI Query] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Rate limit error — give user a helpful message
    if (message.includes("429")) {
      return NextResponse.json({
        text: "I've hit the AI rate limit. Please try again in a minute.",
        actions: [],
        queryType: "summary",
        referencedTaskIds: [],
      } satisfies AIQueryResponse);
    }

    return NextResponse.json(
      { error: "AI query failed", message },
      { status: 500 },
    );
  }
}
