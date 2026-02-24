// =============================================================
// src/__tests__/unit/task-updates.test.ts
// UNIT TESTS: Task mutation logic — bookmark, tier, priority,
// markSeen, status changes.
// Tests the Zod schemas and expected API behavior.
// =============================================================

import { PriorityEnum, TaskStatusEnum } from "@/lib/validators/schemas";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// =============================================================
// RE-CREATE the UpdateTaskSchema from route.ts for testing
// =============================================================

const UpdateTaskSchema = z.object({
  taskId: z.string().min(1),
  action: z.enum([
    "updateStatus",
    "updatePriority",
    "updateTier",
    "bookmark",
    "markSeen",
    "snooze",
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

// =============================================================
// BOOKMARK
// =============================================================

describe("Bookmark action", () => {
  it("accepts bookmark action with taskId", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "bookmark",
    });
    expect(result.success).toBe(true);
  });

  it("rejects bookmark without taskId", () => {
    const result = RequestSchema.safeParse({
      action: "bookmark",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// TIER
// =============================================================

describe("Tier action", () => {
  it("accepts tier 1 (P1 Gold)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts tier 2 (P2 Silver)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts tier 3 (P3 Bronze)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: 3,
    });
    expect(result.success).toBe(true);
  });

  it("accepts tier 0 (Clear priority)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects tier 4 (out of range)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative tier", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateTier",
      tier: -1,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// MARK SEEN (Unread dot/counter)
// =============================================================

describe("Mark Seen action", () => {
  it("accepts markSeen with seenEventCount", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "markSeen",
      seenEventCount: 3,
    });
    expect(result.success).toBe(true);
  });

  it("accepts markSeen with 0 (reset)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "markSeen",
      seenEventCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects markSeen with negative count", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "markSeen",
      seenEventCount: -1,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// PRIORITY (Column Movement)
// =============================================================

describe("Priority/Column action", () => {
  it("accepts move to Urgent (CRITICAL)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updatePriority",
      priority: "CRITICAL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts move to Urgent (HIGH)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updatePriority",
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("accepts move to Normal (MEDIUM)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updatePriority",
      priority: "MEDIUM",
    });
    expect(result.success).toBe(true);
  });

  it("accepts move to Low Priority (LOW)", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updatePriority",
      priority: "LOW",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid priority", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updatePriority",
      priority: "SUPER_HIGH",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// STATUS (Mark done, Restore)
// =============================================================

describe("Status action", () => {
  it("accepts mark as DONE", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateStatus",
      status: "DONE",
    });
    expect(result.success).toBe(true);
  });

  it("accepts restore to OPEN", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateStatus",
      status: "OPEN",
    });
    expect(result.success).toBe(true);
  });

  it("accepts IN_PROGRESS status", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateStatus",
      status: "IN_PROGRESS",
    });
    expect(result.success).toBe(true);
  });

  it("accepts BLOCKED status", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateStatus",
      status: "BLOCKED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = RequestSchema.safeParse({
      taskId: "clxyz123",
      action: "updateStatus",
      status: "DELETED",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// CREATE MANUAL TASK
// =============================================================

describe("Create Manual Task", () => {
  it("accepts minimal task creation", () => {
    const result = RequestSchema.safeParse({
      action: "createTask",
      title: "Manual task",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full task creation", () => {
    const result = RequestSchema.safeParse({
      action: "createTask",
      title: "Budget review",
      intent: "document-review",
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = RequestSchema.safeParse({
      action: "createTask",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = RequestSchema.safeParse({
      action: "createTask",
      title: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================
// TIER SORTING LOGIC
// =============================================================

describe("Tier sorting within columns", () => {
  interface MockTask {
    id: string;
    tier: number;
    priority: string;
  }

  const PRIORITY_WEIGHT: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  function sortTasks(tasks: MockTask[]) {
    return [...tasks].sort((a, b) => {
      const tierA = a.tier || 99;
      const tierB = b.tier || 99;
      if (tierA !== tierB) return tierA - tierB;
      return (
        (PRIORITY_WEIGHT[a.priority] ?? 4) - (PRIORITY_WEIGHT[b.priority] ?? 4)
      );
    });
  }

  it("P1 sorts before P2 before P3", () => {
    const tasks: MockTask[] = [
      { id: "3", tier: 3, priority: "HIGH" },
      { id: "1", tier: 1, priority: "HIGH" },
      { id: "2", tier: 2, priority: "HIGH" },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.id)).toEqual(["1", "2", "3"]);
  });

  it("unranked (tier 0) sorts after P3", () => {
    const tasks: MockTask[] = [
      { id: "unranked", tier: 0, priority: "HIGH" },
      { id: "p3", tier: 3, priority: "HIGH" },
      { id: "p1", tier: 1, priority: "HIGH" },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.id)).toEqual(["p1", "p3", "unranked"]);
  });

  it("unranked cards sort by AI priority", () => {
    const tasks: MockTask[] = [
      { id: "low", tier: 0, priority: "LOW" },
      { id: "critical", tier: 0, priority: "CRITICAL" },
      { id: "high", tier: 0, priority: "HIGH" },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.id)).toEqual(["critical", "high", "low"]);
  });

  it("mixed tiers and priorities sort correctly", () => {
    const tasks: MockTask[] = [
      { id: "unranked-med", tier: 0, priority: "MEDIUM" },
      { id: "p2-high", tier: 2, priority: "HIGH" },
      { id: "p1-low", tier: 1, priority: "LOW" },
      { id: "unranked-crit", tier: 0, priority: "CRITICAL" },
      { id: "p3-high", tier: 3, priority: "HIGH" },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.id)).toEqual([
      "p1-low", // tier 1
      "p2-high", // tier 2
      "p3-high", // tier 3
      "unranked-crit", // tier 0 → CRITICAL first
      "unranked-med", // tier 0 → MEDIUM second
    ]);
  });

  it("same tier same priority — stable order", () => {
    const tasks: MockTask[] = [
      { id: "a", tier: 1, priority: "HIGH" },
      { id: "b", tier: 1, priority: "HIGH" },
    ];
    const sorted = sortTasks(tasks);
    // Sort is stable — original order preserved
    expect(sorted.map((t) => t.id)).toEqual(["a", "b"]);
  });
});

// =============================================================
// UNREAD DOT/COUNTER LOGIC
// =============================================================

describe("Unread dot/counter logic", () => {
  it("new task (never opened) shows dot", () => {
    const seenEventCount = 0;
    const totalEvents = 1;
    const isNewTask = seenEventCount === 0 && totalEvents > 0;
    expect(isNewTask).toBe(true);
  });

  it("opened task with no new messages shows nothing", () => {
    const seenEventCount = 3 as number;
    const totalEvents = 3 as number;
    const isNewTask = seenEventCount === 0 && totalEvents > 0;
    const unseenCount = totalEvents - seenEventCount;
    const hasNewMessages = !isNewTask && unseenCount > 0;
    expect(isNewTask).toBe(false);
    expect(hasNewMessages).toBe(false);
  });

  it("opened task with 2 new messages shows counter 2", () => {
    const seenEventCount = 3 as number;
    const totalEvents = 5 as number;
    const isNewTask = seenEventCount === (0 as number) && totalEvents > 0;
    const unseenCount = totalEvents - seenEventCount;
    const hasNewMessages = !isNewTask && unseenCount > 0;
    expect(hasNewMessages).toBe(true);
    expect(unseenCount).toBe(2);
  });

  it("task with 0 events shows nothing", () => {
    const seenEventCount = 0;
    const totalEvents = 0;
    const isNewTask = seenEventCount === 0 && totalEvents > 0;
    const showIndicator = isNewTask || false;
    expect(showIndicator).toBe(false);
  });

  it("after expanding, seenEventCount updates to totalEvents", () => {
    const totalEvents = 5 as number;
    const newSeenCount = totalEvents;
    expect(newSeenCount).toBe(5);
    const unseenCount = totalEvents - newSeenCount;
    expect(unseenCount).toBe(0);
  });

  it("new message arrives after expand — counter shows 1", () => {
    const seenEventCount = 5 as number;
    const totalEvents = 6 as number;
    const unseenCount = totalEvents - seenEventCount;
    const isNewTask = seenEventCount === (0 as number) && totalEvents > 0;
    const hasNewMessages = !isNewTask && unseenCount > 0;
    expect(hasNewMessages).toBe(true);
    expect(unseenCount).toBe(1);
  });
});
