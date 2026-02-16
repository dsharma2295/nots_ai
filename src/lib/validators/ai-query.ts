// =============================================================
// src/lib/validators/ai-query.ts
// Zod schemas for the AI Search feature.
//
// THREE SHAPES:
//   1. AIQueryRequest — what the frontend sends
//   2. AIAction — structured task mutations the AI can trigger
//   3. AIQueryResponse — what the API returns
// =============================================================

import { z } from "zod";
import { PriorityEnum, TaskStatusEnum } from "./schemas";

// =============================================================
// AI QUERY REQUEST
// =============================================================

export const AIQueryRequestSchema = z.object({
  query: z.string().min(1).max(500),
  // Optional context filters — the AI can use these to narrow scope
  filters: z
    .object({
      platforms: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
    .optional(),
});

export type AIQueryRequest = z.infer<typeof AIQueryRequestSchema>;

// =============================================================
// AI ACTIONS — Structured mutations the AI can request
// =============================================================

export const AIActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("updateStatus"),
    taskId: z.string(),
    status: TaskStatusEnum,
  }),
  z.object({
    type: z.literal("updatePriority"),
    taskId: z.string(),
    priority: PriorityEnum,
  }),
  z.object({
    type: z.literal("createTask"),
    title: z.string().min(1).max(200),
    intent: z.string().optional(),
    priority: PriorityEnum.optional(),
    deadline: z.string().optional(),
  }),
  z.object({
    type: z.literal("snoozeTask"),
    taskId: z.string(),
    until: z.string(), // ISO date
  }),
]);

export type AIAction = z.infer<typeof AIActionSchema>;

// =============================================================
// AI QUERY RESPONSE
// =============================================================

export const AIQueryResponseSchema = z.object({
  // The natural language response shown to the user
  text: z.string(),
  // Optional structured actions the user can confirm
  actions: z.array(AIActionSchema).default([]),
  // What type of query this was — helps frontend render appropriately
  queryType: z.enum([
    "summary",
    "analysis",
    "search",
    "creation",
    "modification",
    "briefing",
  ]),
  // Tasks referenced in the response (for linking)
  referencedTaskIds: z.array(z.string()).default([]),
});

export type AIQueryResponse = z.infer<typeof AIQueryResponseSchema>;
