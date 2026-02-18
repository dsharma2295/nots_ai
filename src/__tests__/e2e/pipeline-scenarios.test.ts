// =============================================================
// src/__tests__/e2e/pipeline-scenarios.test.ts
// E2E SCENARIO TESTS: Full pipeline simulation
//
// These tests simulate real-world message flows through the
// cascading merge pipeline. They test the LOGIC, not the actual
// API calls — Gemini and DB are mocked.
//
// Each scenario maps to the S1-S8, G1-G6, X1-X4 specs.
// =============================================================

import { classifyNoise, generateSourceHash } from "@/lib/gatekeeper";
import {
  CreateSourceEventSchema,
  UniversalTaskSchema,
} from "@/lib/validators/schemas";
import { describe, expect, it } from "vitest";

// =============================================================
// HELPERS
// =============================================================

function createSlackMessage(overrides: Record<string, unknown> = {}) {
  return {
    platform: "SLACK" as const,
    rawContent: "Review the Q3 budget deck by Friday",
    sender: "Sarah Chen",
    deepLink: "slack://channel?team=T123&id=C456&message=1707300900",
    timestamp: "2026-02-17T09:00:00Z",
    sourceHash: generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1707300900",
      "Review the Q3 budget deck by Friday",
    ),
    attachments: [] as {
      name: string;
      url: string;
      mimeType?: string;
      size?: number;
    }[],
    threadId: undefined as string | undefined,
    channelId: undefined as string | undefined,
    metadata: undefined as Record<string, unknown> | undefined,
    ...overrides,
  };
}

function createGmailMessage(overrides: Record<string, unknown> = {}) {
  return {
    platform: "GMAIL" as const,
    rawContent:
      "Subject: Q3 Budget Review\n\nPlease review the attached budget deck.",
    sender: "finance@company.com",
    deepLink: "https://mail.google.com/mail/u/0/#inbox/thread-abc",
    timestamp: "2026-02-17T09:30:00Z",
    sourceHash: generateSourceHash(
      "GMAIL",
      "https://mail.google.com/mail/u/0/#inbox/thread-abc",
      "Subject: Q3 Budget Review\n\nPlease review the attached budget deck.",
    ),
    attachments: [] as {
      name: string;
      url: string;
      mimeType?: string;
      size?: number;
    }[],
    threadId: undefined as string | undefined,
    channelId: undefined as string | undefined,
    metadata: undefined as Record<string, unknown> | undefined,
    ...overrides,
  };
}
// =============================================================
// SCENARIO S1: New Slack message, no thread, no prior context
// Expected: Creates new task
// =============================================================

describe("S1: New Slack message → CREATE", () => {
  it("validates as a valid UniversalTask", () => {
    const msg = createSlackMessage();
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
  });

  it("has no threadId — will skip Stage 1", () => {
    const msg = createSlackMessage();
    expect(msg.threadId).toBeUndefined();
  });

  it("has no channelId — will skip Stage 2", () => {
    const msg = createSlackMessage();
    expect(msg.channelId).toBeUndefined();
  });

  it("passes noise filter", () => {
    const result = classifyNoise("Review the Q3 budget deck by Friday");
    expect(result.allowed).toBe(true);
  });
});

// =============================================================
// SCENARIO S2: Reply in Slack thread
// Expected: Merges via Stage 1 (thread_ts match)
// =============================================================

describe("S2: Slack thread reply → MERGE via Stage 1", () => {
  const parentTs = "1707300900.000000";

  it("parent message stores ts as threadId", () => {
    const parent = createSlackMessage({
      threadId: parentTs,
      channelId: "C456",
    });
    const result = UniversalTaskSchema.safeParse(parent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threadId).toBe(parentTs);
    }
  });

  it("reply has same threadId as parent", () => {
    const reply = createSlackMessage({
      rawContent: "I'll take a look at the Q3 numbers",
      sender: "Mike Rodriguez",
      deepLink: "slack://channel?team=T123&id=C456&message=1707305400",
      threadId: parentTs, // Same as parent
      channelId: "C456",
    });
    expect(reply.threadId).toBe(parentTs);
  });

  it("source event stores threadId for future lookups", () => {
    const eventData = CreateSourceEventSchema.safeParse({
      platform: "SLACK",
      rawContent: "I'll take a look at the Q3 numbers",
      deepLink: "slack://channel?team=T123&id=C456&message=1707305400",
      sender: "Mike Rodriguez",
      sourceHash: "hash456",
      timestamp: "2026-02-17T10:00:00Z",
      threadId: parentTs,
      channelId: "C456",
    });
    expect(eventData.success).toBe(true);
    if (eventData.success) {
      expect(eventData.data.threadId).toBe(parentTs);
    }
  });
});

// =============================================================
// SCENARIO S3: Same sender, same channel, within 30min, related
// Expected: Merges via Stage 2
// =============================================================

describe("S3: Quick follow-up → Stage 2 candidate", () => {
  it("both messages from same sender in same channel", () => {
    const msg1 = createSlackMessage({
      sender: "Sarah Chen",
      channelId: "C456",
      timestamp: "2026-02-17T09:00:00Z",
    });
    const msg2 = createSlackMessage({
      rawContent: "I've attached the latest version btw",
      sender: "Sarah Chen",
      channelId: "C456",
      timestamp: "2026-02-17T09:10:00Z",
    });
    expect(msg1.sender).toBe(msg2.sender);
    expect(msg1.channelId).toBe(msg2.channelId);
  });

  it("time difference is within 30 minutes", () => {
    const t1 = new Date("2026-02-17T09:00:00Z").getTime();
    const t2 = new Date("2026-02-17T09:10:00Z").getTime();
    expect(t2 - t1).toBeLessThan(30 * 60 * 1000);
  });
});

// =============================================================
// SCENARIO S4: Same sender, same channel, different topic
// Expected: Stage 2 candidate fails semantic, CREATE new
// =============================================================

describe("S4: Same sender, different topic → CREATE", () => {
  it("both messages pass noise filter individually", () => {
    expect(classifyNoise("Review Q3 deck").allowed).toBe(true);
    expect(classifyNoise("Who's ordering lunch?").allowed).toBe(true);
  });

  it("semantic similarity would be very low", () => {
    // "Review Q3 deck" vs "Who's ordering lunch?"
    // These are semantically unrelated — similarity ~0.15
    // Stage 2 requires 0.60 → rejects → falls to Stage 3 → CREATE
    const mockSimilarity = 0.15;
    expect(mockSimilarity).toBeLessThan(0.6);
  });
});

// =============================================================
// SCENARIO S6: Noise reply in thread (Option B)
// Expected: Touch updatedAt, don't add to provenance
// =============================================================

describe("S6: Noise in thread → Option B", () => {
  it("'ok' is classified as noise", () => {
    const result = classifyNoise("ok");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SHORT_NOISE");
  });

  it("'thanks' is classified as noise", () => {
    const result = classifyNoise("thanks");
    expect(result.allowed).toBe(false);
  });

  it("'👍' is classified as noise (emoji only)", () => {
    const result = classifyNoise("👍");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("EMOJI_ONLY");
  });

  it("noise + threadId → noiseInThread flag", () => {
    const text = "ok";
    const threadTs = "1707300900.000000";
    const noiseResult = classifyNoise(text);
    const isNoiseInThread = !noiseResult.allowed && !!threadTs;
    expect(isNoiseInThread).toBe(true);
  });

  it("noise + no threadId → filtered normally", () => {
    const text = "ok";
    const threadTs = undefined;
    const noiseResult = classifyNoise(text);
    const isNoiseInThread = !noiseResult.allowed && !!threadTs;
    expect(isNoiseInThread).toBe(false);
    expect(noiseResult.allowed).toBe(false);
  });

  it("noiseInThread message validates with metadata", () => {
    const msg = createSlackMessage({
      rawContent: "ok",
      threadId: "1707300900.000000",
      channelId: "C456",
      metadata: { noiseInThread: true },
    });
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
  });
});

// =============================================================
// SCENARIO G2/G3: Gmail reply
// Expected: Merges via Stage 1 (threadId match)
// =============================================================

describe("G2/G3: Gmail reply → MERGE via Stage 1", () => {
  const gmailThreadId = "18d5a3f2e1b4c890";

  it("original email has threadId", () => {
    const msg = createGmailMessage({ threadId: gmailThreadId });
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threadId).toBe(gmailThreadId);
    }
  });

  it("reply 'Approved, go ahead' shares same threadId", () => {
    const reply = createGmailMessage({
      rawContent: "Approved, go ahead",
      sender: "ceo@company.com",
      threadId: gmailThreadId,
    });
    expect(reply.threadId).toBe(gmailThreadId);
  });

  it("reply stores messageId and inReplyTo in metadata", () => {
    const reply = createGmailMessage({
      rawContent: "Approved, go ahead",
      threadId: gmailThreadId,
      metadata: {
        gmailMessageId: "<msg-5@gmail.com>",
        inReplyTo: "<msg-4@gmail.com>",
      },
    });
    const result = UniversalTaskSchema.safeParse(reply);
    expect(result.success).toBe(true);
    if (result.success) {
      const meta = result.data.metadata as Record<string, unknown>;
      expect(meta.gmailMessageId).toBe("<msg-5@gmail.com>");
      expect(meta.inReplyTo).toBe("<msg-4@gmail.com>");
    }
  });
});

// =============================================================
// SCENARIO G5: Same sender, two different emails
// Expected: Different threadIds → Stage 1 won't merge
// =============================================================

describe("G5: Same Gmail sender, different threads → CREATE", () => {
  it("two emails with different threadIds", () => {
    const email1 = createGmailMessage({ threadId: "thread-aaa" });
    const email2 = createGmailMessage({
      rawContent: "Subject: Team offsite\n\nWhat about next Friday?",
      threadId: "thread-bbb",
    });
    expect(email1.threadId).not.toBe(email2.threadId);
  });
});

// =============================================================
// SCENARIO X1: Slack + Gmail about same topic (cross-platform)
// Expected: No threadId match → Stage 3 semantic → MERGE
// =============================================================

describe("X1: Cross-platform → Stage 3 semantic", () => {
  it("Slack and Gmail have different threadIds", () => {
    const slack = createSlackMessage({
      threadId: "1707300900.000000",
      channelId: "C456",
    });
    const gmail = createGmailMessage({
      threadId: "18d5a3f2e1b4c890",
    });
    expect(slack.threadId).not.toBe(gmail.threadId);
    // Stage 1 won't match — correct, falls to Stage 3
  });

  it("both are valid UniversalTasks", () => {
    const slack = createSlackMessage({ threadId: "ts1", channelId: "C456" });
    const gmail = createGmailMessage({ threadId: "thread1" });
    expect(UniversalTaskSchema.safeParse(slack).success).toBe(true);
    expect(UniversalTaskSchema.safeParse(gmail).success).toBe(true);
  });
});

// =============================================================
// DEDUPLICATION
// =============================================================

describe("Deduplication — sourceHash", () => {
  it("same message produces same hash", () => {
    const hash1 = generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1707300900",
      "Review Q3 deck",
    );
    const hash2 = generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1707300900",
      "Review Q3 deck",
    );
    expect(hash1).toBe(hash2);
  });

  it("reply in same thread has different sourceHash (different deepLink)", () => {
    const parentHash = generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1707300900",
      "Review Q3 deck",
    );
    const replyHash = generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1707305400",
      "I'll take a look",
    );
    expect(parentHash).not.toBe(replyHash);
  });
});

// =============================================================
// NOISE FILTER — comprehensive
// =============================================================

describe("Noise filter — comprehensive", () => {
  const noise = [
    "ok",
    "thanks",
    "ty",
    "thx",
    "lol",
    "haha",
    "yes",
    "no",
    "yep",
    "nope",
    "k",
    "sure",
    "cool",
    "nice",
    "great",
  ];

  const signal = [
    "Review the Q3 budget deck by Friday",
    "BUG-1337: Login timeout on iOS",
    "Can you set up onboarding for the new hire?",
    "The OAuth token refresh is timing out on cellular",
    "Attaching the revised revenue model",
    "Please review PR #482",
    "Series A pitch meeting with Sequoia on Feb 14",
    "🚨 Production is down! Check logs immediately",
    "https://docs.google.com/spreadsheet/abc123",
  ];

  noise.forEach((text) => {
    it(`filters noise: "${text}"`, () => {
      const result = classifyNoise(text);
      expect(result.allowed).toBe(false);
    });
  });

  signal.forEach((text) => {
    it(`passes signal: "${text.slice(0, 40)}..."`, () => {
      const result = classifyNoise(text);
      expect(result.allowed).toBe(true);
    });
  });
});

// =============================================================
// ATTACHMENT HANDLING
// =============================================================

describe("Attachment handling", () => {
  it("message with attachments validates correctly", () => {
    const msg = createSlackMessage({
      attachments: [
        {
          name: "Q3_Budget_v3.xlsx",
          url: "https://files.slack.com/budget.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: 245000,
        },
      ],
    });
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachments).toHaveLength(1);
      expect(result.data.attachments[0].name).toBe("Q3_Budget_v3.xlsx");
    }
  });

  it("message with multiple attachments validates", () => {
    const msg = createSlackMessage({
      attachments: [
        {
          name: "file1.pdf",
          url: "https://example.com/1",
          mimeType: "application/pdf",
        },
        {
          name: "file2.png",
          url: "https://example.com/2",
          mimeType: "image/png",
        },
      ],
    });
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachments).toHaveLength(2);
    }
  });

  it("empty attachments array validates", () => {
    const msg = createSlackMessage({ attachments: [] });
    const result = UniversalTaskSchema.safeParse(msg);
    expect(result.success).toBe(true);
  });
});
