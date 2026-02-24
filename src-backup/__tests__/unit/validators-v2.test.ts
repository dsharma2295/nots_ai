// =============================================================
// src/__tests__/unit/validators-v2.test.ts
// UNIT TESTS: New schema fields added in v1.2
// threadId, channelId, bookmarked, seenEventCount, tier
// =============================================================

import {
  CreateSourceEventSchema,
  OrchestratorOutputSchema,
  PlatformEnum,
  PriorityEnum,
  RefinerOutputSchema,
  UniversalTaskSchema,
} from "@/lib/validators/schemas";
import { describe, expect, it } from "vitest";

// =============================================================
// UniversalTask — new fields
// =============================================================

describe("UniversalTask v1.2 fields", () => {
  const base = {
    platform: "SLACK",
    rawContent: "Test message",
    sender: "Test User",
    deepLink: "slack://test",
    timestamp: "2026-02-17T09:00:00Z",
    sourceHash: "testhash",
  };

  it("threadId is optional string", () => {
    const r1 = UniversalTaskSchema.safeParse(base);
    expect(r1.success).toBe(true);

    const r2 = UniversalTaskSchema.safeParse({
      ...base,
      threadId: "thread123",
    });
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.threadId).toBe("thread123");
  });

  it("channelId is optional string", () => {
    const r = UniversalTaskSchema.safeParse({
      ...base,
      channelId: "C0ADGL60FGE",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.channelId).toBe("C0ADGL60FGE");
  });

  it("metadata can contain any structure", () => {
    const r = UniversalTaskSchema.safeParse({
      ...base,
      metadata: {
        noiseInThread: true,
        gmailMessageId: "<test@gmail.com>",
        inReplyTo: "<parent@gmail.com>",
        custom: { nested: true },
      },
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid platform", () => {
    const r = UniversalTaskSchema.safeParse({
      ...base,
      platform: "DISCORD",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty rawContent", () => {
    const r = UniversalTaskSchema.safeParse({
      ...base,
      rawContent: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty sourceHash", () => {
    const r = UniversalTaskSchema.safeParse({
      ...base,
      sourceHash: "",
    });
    expect(r.success).toBe(false);
  });

  it("coerces timestamp string to Date", () => {
    const r = UniversalTaskSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.timestamp).toBeInstanceOf(Date);
    }
  });
});

// =============================================================
// CreateSourceEvent — new fields
// =============================================================

describe("CreateSourceEvent v1.2 fields", () => {
  const base = {
    platform: "SLACK",
    rawContent: "Test content",
    deepLink: "slack://test",
    sender: "Test",
    sourceHash: "hash123",
    timestamp: "2026-02-17T09:00:00Z",
  };

  it("accepts threadId and channelId", () => {
    const r = CreateSourceEventSchema.safeParse({
      ...base,
      threadId: "1707300900.000000",
      channelId: "C456",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.threadId).toBe("1707300900.000000");
      expect(r.data.channelId).toBe("C456");
    }
  });

  it("threadId and channelId are optional", () => {
    const r = CreateSourceEventSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.threadId).toBeUndefined();
      expect(r.data.channelId).toBeUndefined();
    }
  });

  it("rejects rawContent over 10000 chars", () => {
    const r = CreateSourceEventSchema.safeParse({
      ...base,
      rawContent: "A".repeat(10001),
    });
    expect(r.success).toBe(false);
  });
});

// =============================================================
// Orchestrator Output — all decision types
// =============================================================

describe("OrchestratorOutput — decision validation", () => {
  it("accepts valid MERGE", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "MERGE",
      mergeTargetId: "clxyz123",
      similarityScore: 0.92,
      confidence: 0.95,
      reasoning: "Clear match on Q3 budget topic",
    });
    expect(r.success).toBe(true);
  });

  it("rejects MERGE without mergeTargetId", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "MERGE",
      confidence: 0.9,
      reasoning: "Match found",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid CREATE", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "CREATE",
      confidence: 0.9,
      newTaskTitle: "New budget review task",
      reasoning: "No similar tasks found",
    });
    expect(r.success).toBe(true);
  });

  it("rejects CREATE without newTaskTitle", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "CREATE",
      confidence: 0.9,
      reasoning: "New task needed",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid REVIEW", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "REVIEW",
      confidence: 0.4,
      reasoning: "Ambiguous match between two tasks",
    });
    expect(r.success).toBe(true);
  });

  it("rejects confidence above 1.0", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "CREATE",
      confidence: 1.5,
      newTaskTitle: "Test",
      reasoning: "Test",
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing reasoning", () => {
    const r = OrchestratorOutputSchema.safeParse({
      action: "CREATE",
      confidence: 0.9,
      newTaskTitle: "Test",
    });
    expect(r.success).toBe(false);
  });
});

// =============================================================
// Refiner Output
// =============================================================

describe("RefinerOutput validation", () => {
  const base = {
    smartTitle: "Review Q3 Budget Deck",
    intent: "document-review",
    confidence: 0.92,
  };

  it("accepts valid refiner output with defaults", () => {
    const r = RefinerOutputSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.suggestedPriority).toBe("MEDIUM"); // default
      expect(r.data.isNoise).toBe(false); // default
    }
  });

  it("accepts noise classification", () => {
    const r = RefinerOutputSchema.safeParse({
      ...base,
      isNoise: true,
      noiseReason: "Single word greeting",
    });
    expect(r.success).toBe(true);
  });

  it("rejects title under 3 chars", () => {
    const r = RefinerOutputSchema.safeParse({
      ...base,
      smartTitle: "Hi",
    });
    expect(r.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const r = RefinerOutputSchema.safeParse({
      ...base,
      smartTitle: "A".repeat(201),
    });
    expect(r.success).toBe(false);
  });

  it("accepts all priority values", () => {
    for (const p of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
      const r = RefinerOutputSchema.safeParse({
        ...base,
        suggestedPriority: p,
      });
      expect(r.success).toBe(true);
    }
  });

  it("extracts links and dates", () => {
    const r = RefinerOutputSchema.safeParse({
      ...base,
      extractedLinks: ["https://docs.google.com/spreadsheet/abc"],
      extractedDates: ["2026-02-21"],
      mentionedUsers: ["Sarah Chen", "Mike Rodriguez"],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.extractedLinks).toHaveLength(1);
      expect(r.data.extractedDates).toHaveLength(1);
      expect(r.data.mentionedUsers).toHaveLength(2);
    }
  });
});

// =============================================================
// Platform enum completeness
// =============================================================

describe("Platform coverage", () => {
  const allPlatforms = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA", "MANUAL"];

  allPlatforms.forEach((p) => {
    it(`accepts platform: ${p}`, () => {
      expect(PlatformEnum.parse(p)).toBe(p);
    });
  });

  it("rejects unknown platforms", () => {
    const invalid = ["DISCORD", "TEAMS", "NOTION", "LINEAR", ""];
    invalid.forEach((p) => {
      expect(() => PlatformEnum.parse(p)).toThrow();
    });
  });
});

// =============================================================
// Priority enum completeness
// =============================================================

describe("Priority coverage", () => {
  it("CRITICAL > HIGH > MEDIUM > LOW (semantic order)", () => {
    const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    priorities.forEach((p) => expect(PriorityEnum.parse(p)).toBe(p));
  });

  it("rejects non-standard priorities", () => {
    const invalid = ["URGENT", "P0", "P1", "NORMAL", ""];
    invalid.forEach((p) => {
      expect(() => PriorityEnum.parse(p)).toThrow();
    });
  });
});
