// src/__tests__/unit/validators.test.ts
// UNIT TESTS: Zod validation schemas.
// No DB, no network. Pure input/output validation.

import {
  CreateAttachmentSchema,
  CreateNodalTaskSchema,
  CreateSourceEventSchema,
  CreateTaskSourceLinkSchema,
  DismissLinkSchema,
  GatekeeperResultSchema,
  GmailMessageSchema,
  GmailPubSubSchema,
  JiraWebhookSchema,
  OrchestratorOutputSchema,
  PlatformEnum,
  PriorityEnum,
  RefinerOutputSchema,
  safeParse,
  SlackEventSchema,
  TaskStatusEnum,
  UniversalTaskSchema,
  UpdateNodalTaskSchema,
} from "@/lib/validators/schemas";
import { describe, expect, it } from "vitest";

// =============================================================
// ENUMS
// =============================================================
describe("Enums", () => {
  it("accepts all valid platforms", () => {
    const platforms = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA", "MANUAL"];
    platforms.forEach((p) => expect(PlatformEnum.parse(p)).toBe(p));
  });

  it("rejects invalid platform", () => {
    expect(() => PlatformEnum.parse("DISCORD")).toThrow();
  });

  it("accepts all valid priorities", () => {
    const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    priorities.forEach((p) => expect(PriorityEnum.parse(p)).toBe(p));
  });

  it("accepts all valid statuses", () => {
    const statuses = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE", "ARCHIVED"];
    statuses.forEach((s) => expect(TaskStatusEnum.parse(s)).toBe(s));
  });
});

// =============================================================
// BOUNDARY 1: INBOUND WEBHOOKS
// =============================================================
describe("SlackEventSchema", () => {
  const validSlack = {
    type: "event_callback",
    event: {
      type: "message",
      user: "U123ABC",
      text: "Can you review the budget deck?",
      channel: "C456DEF",
      ts: "1234567890.123456",
    },
    team_id: "T789GHI",
    event_id: "Ev123",
  };

  it("accepts a valid Slack event", () => {
    expect(() => SlackEventSchema.parse(validSlack)).not.toThrow();
  });

  it("accepts Slack event with files", () => {
    const withFiles = {
      ...validSlack,
      event: {
        ...validSlack.event,
        files: [
          {
            name: "budget.pdf",
            url_private: "https://files.slack.com/budget.pdf",
            mimetype: "application/pdf",
            size: 12345,
          },
        ],
      },
    };
    expect(() => SlackEventSchema.parse(withFiles)).not.toThrow();
  });

  it("rejects wrong type literal", () => {
    const bad = { ...validSlack, type: "url_verification" };
    expect(() => SlackEventSchema.parse(bad)).toThrow();
  });

  it("rejects missing channel", () => {
    const bad = {
      ...validSlack,
      event: { ...validSlack.event, channel: "" },
    };
    expect(() => SlackEventSchema.parse(bad)).toThrow();
  });

  it("defaults empty text to empty string", () => {
    const noText = {
      ...validSlack,
      event: { ...validSlack.event, text: undefined },
    };
    const parsed = SlackEventSchema.parse(noText);
    expect(parsed.event.text).toBe("");
  });
});

describe("GmailPubSubSchema", () => {
  const valid = {
    message: {
      data: "eyJlbWFpbEFkZHJlc3MiOiJ0ZXN0QGdtYWlsLmNvbSJ9",
      messageId: "msg-123",
      publishTime: "2026-02-07T10:00:00Z",
    },
    subscription: "projects/nots-ai/subscriptions/gmail-push",
  };

  it("accepts a valid Gmail Pub/Sub notification", () => {
    expect(() => GmailPubSubSchema.parse(valid)).not.toThrow();
  });

  it("rejects missing data", () => {
    const bad = { ...valid, message: { ...valid.message, data: "" } };
    expect(() => GmailPubSubSchema.parse(bad)).toThrow();
  });

  it("rejects invalid publishTime format", () => {
    const bad = {
      ...valid,
      message: { ...valid.message, publishTime: "not-a-date" },
    };
    expect(() => GmailPubSubSchema.parse(bad)).toThrow();
  });
});

describe("GmailMessageSchema", () => {
  it("accepts valid email with defaults", () => {
    const minimal = {
      id: "msg1",
      threadId: "thread1",
      from: "alice@co.com",
      date: "2026-02-07",
    };
    const parsed = GmailMessageSchema.parse(minimal);
    expect(parsed.subject).toBe("(No Subject)");
    expect(parsed.snippet).toBe("");
    expect(parsed.body).toBe("");
    expect(parsed.attachments).toEqual([]);
  });

  it("accepts email with attachments", () => {
    const withAttach = {
      id: "msg1",
      threadId: "thread1",
      from: "bob@co.com",
      date: "2026-02-07",
      subject: "Q3 Budget",
      attachments: [
        {
          filename: "budget.xlsx",
          mimeType: "application/xlsx",
          attachmentId: "att1",
        },
      ],
    };
    const parsed = GmailMessageSchema.parse(withAttach);
    expect(parsed.attachments).toHaveLength(1);
  });
});

describe("JiraWebhookSchema", () => {
  const valid = {
    webhookEvent: "jira:issue_updated",
    issue: {
      id: "10001",
      key: "PROJ-123",
      fields: {
        summary: "Fix login bug",
        description: "Users can't log in",
        status: { name: "In Progress" },
        priority: { name: "High" },
        assignee: { displayName: "Alice", emailAddress: "alice@co.com" },
        created: "2026-02-01T10:00:00Z",
        updated: "2026-02-07T10:00:00Z",
      },
    },
    user: { displayName: "Bob", emailAddress: "bob@co.com" },
  };

  it("accepts a valid Jira webhook", () => {
    expect(() => JiraWebhookSchema.parse(valid)).not.toThrow();
  });

  it("accepts null assignee", () => {
    const noAssignee = {
      ...valid,
      issue: {
        ...valid.issue,
        fields: { ...valid.issue.fields, assignee: null },
      },
    };
    expect(() => JiraWebhookSchema.parse(noAssignee)).not.toThrow();
  });

  it("rejects missing issue key", () => {
    const bad = {
      ...valid,
      issue: { ...valid.issue, key: "" },
    };
    expect(() => JiraWebhookSchema.parse(bad)).toThrow();
  });
});

// =============================================================
// UNIVERSAL TASK (Normalized Input)
// =============================================================
describe("UniversalTaskSchema", () => {
  const valid = {
    platform: "SLACK",
    rawContent: "Please review the Q3 budget deck",
    sender: "alice@company.com",
    deepLink: "slack://channel?team=T123&id=C456",
    timestamp: "2026-02-07T10:00:00Z",
    sourceHash: "sha256-abc123def456",
  };

  it("accepts a valid universal task", () => {
    const parsed = UniversalTaskSchema.parse(valid);
    expect(parsed.platform).toBe("SLACK");
    expect(parsed.attachments).toEqual([]);
    expect(parsed.timestamp).toBeInstanceOf(Date);
  });

  it("coerces timestamp string to Date", () => {
    const parsed = UniversalTaskSchema.parse(valid);
    expect(parsed.timestamp).toBeInstanceOf(Date);
  });

  it("rejects empty content", () => {
    const bad = { ...valid, rawContent: "" };
    expect(() => UniversalTaskSchema.parse(bad)).toThrow();
  });

  it("rejects missing sourceHash", () => {
    const bad = { ...valid, sourceHash: "" };
    expect(() => UniversalTaskSchema.parse(bad)).toThrow();
  });

  it("accepts task with attachments", () => {
    const withFiles = {
      ...valid,
      attachments: [
        {
          name: "budget.pdf",
          url: "https://drive.google.com/file/abc",
          mimeType: "application/pdf",
          size: 245760,
        },
      ],
    };
    const parsed = UniversalTaskSchema.parse(withFiles);
    expect(parsed.attachments).toHaveLength(1);
  });

  it("rejects attachment with invalid URL", () => {
    const bad = {
      ...valid,
      attachments: [{ name: "file.pdf", url: "not-a-url" }],
    };
    expect(() => UniversalTaskSchema.parse(bad)).toThrow();
  });

  it("rejects invalid platform", () => {
    const bad = { ...valid, platform: "DISCORD" };
    expect(() => UniversalTaskSchema.parse(bad)).toThrow();
  });
});

// =============================================================
// BOUNDARY 2: AGENT OUTPUTS
// =============================================================
describe("RefinerOutputSchema", () => {
  const valid = {
    smartTitle: "Review Q3 Budget Deck",
    intent: "document-review",
    confidence: 0.92,
  };

  it("accepts valid refiner output", () => {
    const parsed = RefinerOutputSchema.parse(valid);
    expect(parsed.suggestedPriority).toBe("MEDIUM"); // default
    expect(parsed.isNoise).toBe(false); // default
    expect(parsed.extractedLinks).toEqual([]); // default
  });

  it("rejects title shorter than 3 chars", () => {
    const bad = { ...valid, smartTitle: "Hi" };
    expect(() => RefinerOutputSchema.parse(bad)).toThrow();
  });

  it("rejects title longer than 200 chars", () => {
    const bad = { ...valid, smartTitle: "x".repeat(201) };
    expect(() => RefinerOutputSchema.parse(bad)).toThrow();
  });

  it("rejects confidence above 1", () => {
    const bad = { ...valid, confidence: 1.5 };
    expect(() => RefinerOutputSchema.parse(bad)).toThrow();
  });

  it("rejects confidence below 0", () => {
    const bad = { ...valid, confidence: -0.1 };
    expect(() => RefinerOutputSchema.parse(bad)).toThrow();
  });

  it("accepts noise classification", () => {
    const noise = {
      ...valid,
      isNoise: true,
      noiseReason: "Single emoji reaction",
    };
    const parsed = RefinerOutputSchema.parse(noise);
    expect(parsed.isNoise).toBe(true);
  });

  it("accepts extracted dates as strings and coerces", () => {
    const withDates = {
      ...valid,
      extractedDates: ["2026-03-15", "2026-04-01T10:00:00Z"],
    };
    const parsed = RefinerOutputSchema.parse(withDates);
    expect(parsed.extractedDates[0]).toBeInstanceOf(Date);
    expect(parsed.extractedDates[1]).toBeInstanceOf(Date);
  });
});

describe("OrchestratorOutputSchema", () => {
  it("accepts a valid MERGE action", () => {
    const merge = {
      action: "MERGE",
      mergeTargetId: "clxyz123",
      similarityScore: 0.91,
      confidence: 0.88,
      reasoning: "High semantic overlap with existing budget task",
    };
    expect(() => OrchestratorOutputSchema.parse(merge)).not.toThrow();
  });

  it("accepts a valid CREATE action", () => {
    const create = {
      action: "CREATE",
      confidence: 0.95,
      newTaskTitle: "Onboard new client: Acme Corp",
      reasoning: "No existing tasks match this intent",
    };
    expect(() => OrchestratorOutputSchema.parse(create)).not.toThrow();
  });

  it("accepts a valid REVIEW action", () => {
    const review = {
      action: "REVIEW",
      confidence: 0.55,
      reasoning: "Multiple tasks match with similar scores",
    };
    expect(() => OrchestratorOutputSchema.parse(review)).not.toThrow();
  });

  it("rejects MERGE without mergeTargetId", () => {
    const bad = {
      action: "MERGE",
      confidence: 0.88,
      reasoning: "Should merge",
    };
    expect(() => OrchestratorOutputSchema.parse(bad)).toThrow();
  });

  it("rejects CREATE without newTaskTitle", () => {
    const bad = {
      action: "CREATE",
      confidence: 0.95,
      reasoning: "Should create",
    };
    expect(() => OrchestratorOutputSchema.parse(bad)).toThrow();
  });

  it("rejects missing reasoning", () => {
    const bad = {
      action: "CREATE",
      confidence: 0.95,
      newTaskTitle: "New task",
      reasoning: "",
    };
    expect(() => OrchestratorOutputSchema.parse(bad)).toThrow();
  });
});

// =============================================================
// BOUNDARY 3: DATABASE WRITES
// =============================================================
describe("CreateNodalTaskSchema", () => {
  it("accepts valid task with defaults", () => {
    const parsed = CreateNodalTaskSchema.parse({
      userId: "clxyz123456789012345678",
      title: "Review Q3 Budget",
    });
    expect(parsed.priority).toBe("MEDIUM");
    expect(parsed.status).toBe("OPEN");
    expect(parsed.confidence).toBe(0);
    expect(parsed.needsReview).toBe(false);
    expect(parsed.embeddingModel).toBe("gemini-text-embedding-004");
  });

  it("rejects non-cuid userId", () => {
    const bad = { userId: "not-a-cuid", title: "Test" };
    expect(() => CreateNodalTaskSchema.parse(bad)).toThrow();
  });

  it("rejects empty title", () => {
    const bad = { userId: "clxyz123456789012345678", title: "" };
    expect(() => CreateNodalTaskSchema.parse(bad)).toThrow();
  });

  it("rejects title over 200 chars", () => {
    const bad = { userId: "clxyz123456789012345678", title: "x".repeat(201) };
    expect(() => CreateNodalTaskSchema.parse(bad)).toThrow();
  });
});

describe("CreateSourceEventSchema", () => {
  const valid = {
    platform: "SLACK",
    rawContent: "Review the budget deck",
    deepLink: "slack://channel?team=T123",
    sourceHash: "sha256-abc",
    timestamp: "2026-02-07T10:00:00Z",
  };

  it("accepts valid source event", () => {
    const parsed = CreateSourceEventSchema.parse(valid);
    expect(parsed.timestamp).toBeInstanceOf(Date);
  });

  it("rejects content over 10000 chars", () => {
    const bad = { ...valid, rawContent: "x".repeat(10001) };
    expect(() => CreateSourceEventSchema.parse(bad)).toThrow();
  });

  it("rejects empty sourceHash", () => {
    const bad = { ...valid, sourceHash: "" };
    expect(() => CreateSourceEventSchema.parse(bad)).toThrow();
  });
});

describe("CreateTaskSourceLinkSchema", () => {
  const valid = {
    taskId: "clxyz123456789012345678",
    eventId: "clxyz987654321098765432",
    relevanceScore: 0.92,
  };

  it("accepts valid link", () => {
    const parsed = CreateTaskSourceLinkSchema.parse(valid);
    expect(parsed.humanVerified).toBe(false); // default
  });

  it("rejects relevance score above 1", () => {
    const bad = { ...valid, relevanceScore: 1.1 };
    expect(() => CreateTaskSourceLinkSchema.parse(bad)).toThrow();
  });

  it("rejects negative relevance score", () => {
    const bad = { ...valid, relevanceScore: -0.5 };
    expect(() => CreateTaskSourceLinkSchema.parse(bad)).toThrow();
  });

  it("rejects non-cuid taskId", () => {
    const bad = { ...valid, taskId: "bad-id" };
    expect(() => CreateTaskSourceLinkSchema.parse(bad)).toThrow();
  });
});

describe("DismissLinkSchema", () => {
  it("accepts valid dismiss action", () => {
    const parsed = DismissLinkSchema.parse({
      linkId: "clxyz123456789012345678",
      dismissedBy: "clxyz987654321098765432",
    });
    expect(parsed.linkId).toBeDefined();
  });

  it("rejects non-cuid linkId", () => {
    expect(() =>
      DismissLinkSchema.parse({
        linkId: "bad",
        dismissedBy: "clxyz987654321098765432",
      }),
    ).toThrow();
  });
});

describe("CreateAttachmentSchema", () => {
  it("accepts valid attachment", () => {
    const parsed = CreateAttachmentSchema.parse({
      eventId: "clxyz123456789012345678",
      name: "budget.pdf",
      url: "https://drive.google.com/file/abc",
    });
    expect(parsed.mimeType).toBeUndefined();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      CreateAttachmentSchema.parse({
        eventId: "clxyz123456789012345678",
        name: "file.pdf",
        url: "not-a-url",
      }),
    ).toThrow();
  });

  it("rejects negative file size", () => {
    expect(() =>
      CreateAttachmentSchema.parse({
        eventId: "clxyz123456789012345678",
        name: "file.pdf",
        url: "https://example.com/file.pdf",
        size: -100,
      }),
    ).toThrow();
  });
});

describe("UpdateNodalTaskSchema", () => {
  it("accepts partial update", () => {
    const parsed = UpdateNodalTaskSchema.parse({ priority: "HIGH" });
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.title).toBeUndefined();
  });

  it("accepts empty update (no fields)", () => {
    const parsed = UpdateNodalTaskSchema.parse({});
    expect(Object.keys(parsed).length).toBe(0);
  });
});

// =============================================================
// GATEKEEPER RESULT
// =============================================================
describe("GatekeeperResultSchema", () => {
  it("accepts passed result", () => {
    const parsed = GatekeeperResultSchema.parse({
      allowed: true,
      reason: "PASSED",
      sourceHash: "sha256-abc",
    });
    expect(parsed.allowed).toBe(true);
  });

  it("accepts all rejection reasons", () => {
    const reasons = [
      "BOT_MESSAGE",
      "EMOJI_ONLY",
      "SHORT_NOISE",
      "DUPLICATE",
      "HMAC_FAILED",
    ] as const;
    reasons.forEach((reason) => {
      const parsed = GatekeeperResultSchema.parse({ allowed: false, reason });
      expect(parsed.reason).toBe(reason);
    });
  });

  it("rejects unknown reason", () => {
    expect(() =>
      GatekeeperResultSchema.parse({ allowed: false, reason: "UNKNOWN" }),
    ).toThrow();
  });
});

// =============================================================
// safeParse HELPER
// =============================================================
describe("safeParse helper", () => {
  it("returns success for valid data", () => {
    const result = safeParse(PlatformEnum, "SLACK");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("SLACK");
  });

  it("returns failure for invalid data without throwing", () => {
    const result = safeParse(PlatformEnum, "DISCORD");
    expect(result.success).toBe(false);
  });

  it("returns typed error details on failure", () => {
    const result = safeParse(CreateNodalTaskSchema, {
      userId: "bad",
      title: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
