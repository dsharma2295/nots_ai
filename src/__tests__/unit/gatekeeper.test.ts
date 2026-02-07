// src/__tests__/unit/gatekeeper.test.ts
// UNIT TESTS: Gatekeeper — HMAC verification + noise filtering.
// No DB calls (mocked). No network. Pure logic.

import {
  classifyNoise,
  generateSourceHash,
  isDuplicate,
  runGatekeeper,
  verifyGmailPush,
  verifyJiraSignature,
  verifySlackSignature,
  type GatekeeperInput,
} from "@/lib/gatekeeper";
import crypto from "crypto";
import { describe, expect, it, vi } from "vitest";

// =============================================================
// HELPER: Generate a valid Slack signature for testing
// =============================================================
function makeSlackSignature(
  secret: string,
  timestamp: string,
  body: string,
): string {
  const basestring = `v0:${timestamp}:${body}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(basestring, "utf8")
    .digest("hex");
  return `v0=${sig}`;
}

function makeJiraSignature(secret: string, body: string): string {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");
  return `sha256=${sig}`;
}

function nowTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

// =============================================================
// HMAC VERIFICATION: SLACK
// =============================================================
describe("verifySlackSignature", () => {
  const secret = "8f742231b10e8888abcd99yyyzzz85a5";
  const body = '{"type":"event_callback","event":{"text":"hello"}}';

  it("accepts a valid signature", () => {
    const ts = nowTimestamp();
    const sig = makeSlackSignature(secret, ts, body);
    expect(verifySlackSignature(body, ts, sig, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const ts = nowTimestamp();
    const sig = makeSlackSignature(secret, ts, body);
    expect(verifySlackSignature(body + "tampered", ts, sig, secret)).toBe(
      false,
    );
  });

  it("rejects a wrong secret", () => {
    const ts = nowTimestamp();
    const sig = makeSlackSignature("wrong-secret", ts, body);
    expect(verifySlackSignature(body, ts, sig, secret)).toBe(false);
  });

  it("rejects a stale timestamp (>5 minutes old)", () => {
    const staleTs = (Math.floor(Date.now() / 1000) - 301).toString();
    const sig = makeSlackSignature(secret, staleTs, body);
    expect(verifySlackSignature(body, staleTs, sig, secret)).toBe(false);
  });

  it("accepts a timestamp within 5 minutes", () => {
    const recentTs = (Math.floor(Date.now() / 1000) - 299).toString();
    const sig = makeSlackSignature(secret, recentTs, body);
    expect(verifySlackSignature(body, recentTs, sig, secret)).toBe(true);
  });

  it("rejects invalid timestamp", () => {
    const sig = makeSlackSignature(secret, "not-a-number", body);
    expect(verifySlackSignature(body, "not-a-number", sig, secret)).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(verifySlackSignature(body, nowTimestamp(), "", secret)).toBe(false);
  });
});

// =============================================================
// HMAC VERIFICATION: JIRA
// =============================================================
describe("verifyJiraSignature", () => {
  const secret = "jira-webhook-secret-123";
  const body = '{"webhookEvent":"jira:issue_updated"}';

  it("accepts a valid signature", () => {
    const sig = makeJiraSignature(secret, body);
    expect(verifyJiraSignature(body, sig, secret)).toBe(true);
  });

  it("rejects tampered body", () => {
    const sig = makeJiraSignature(secret, body);
    expect(verifyJiraSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects wrong secret", () => {
    const sig = makeJiraSignature("wrong", body);
    expect(verifyJiraSignature(body, sig, secret)).toBe(false);
  });

  it("rejects missing sha256= prefix", () => {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyJiraSignature(body, sig, secret)).toBe(false);
  });
});

// =============================================================
// GMAIL PUSH VERIFICATION
// =============================================================
describe("verifyGmailPush", () => {
  it("accepts matching subscription", () => {
    const sub = "projects/nots-ai/subscriptions/gmail-push";
    expect(verifyGmailPush(sub, sub)).toBe(true);
  });

  it("rejects mismatched subscription", () => {
    expect(
      verifyGmailPush(
        "projects/nots-ai/subscriptions/gmail-push",
        "projects/other/subscriptions/gmail-push",
      ),
    ).toBe(false);
  });
});

// =============================================================
// NOISE FILTERING
// =============================================================
describe("classifyNoise", () => {
  describe("Bot detection", () => {
    it("rejects explicit bot messages", () => {
      const result = classifyNoise("Deploy complete", undefined, true);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });

    it("rejects slackbot sender", () => {
      const result = classifyNoise("Reminder: standup", "slackbot");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });

    it("rejects github-bot sender", () => {
      const result = classifyNoise("PR merged", "github-bot");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });

    it("rejects dependabot sender", () => {
      const result = classifyNoise("Bump lodash", "dependabot[bot]");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });

    it("rejects noreply senders", () => {
      const result = classifyNoise("Your receipt", "noreply@company.com");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });

    it("rejects no-reply senders", () => {
      const result = classifyNoise("Notification", "no-reply@app.com");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("BOT_MESSAGE");
    });
  });

  describe("Emoji-only detection", () => {
    it("rejects single emoji", () => {
      const result = classifyNoise("👍");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("EMOJI_ONLY");
    });

    it("rejects multiple emojis", () => {
      const result = classifyNoise("🎉🎊🥳");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("EMOJI_ONLY");
    });

    it("rejects emojis with whitespace", () => {
      const result = classifyNoise("  👍  ");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("EMOJI_ONLY");
    });

    it("allows emoji mixed with text", () => {
      const result = classifyNoise("Great work on the budget 🎉");
      expect(result.allowed).toBe(true);
    });
  });

  describe("Short noise phrases", () => {
    const noiseWords = [
      "thanks",
      "thank you",
      "thx",
      "ty",
      "ok",
      "okay",
      "got it",
      "sounds good",
      "lol",
      "yes",
      "no",
      "cool",
      "nice",
      "great",
      "sure",
      "np",
      "will do",
      "done",
      "noted",
      "+1",
    ];

    noiseWords.forEach((word) => {
      it(`rejects "${word}" as noise`, () => {
        const result = classifyNoise(word);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("SHORT_NOISE");
      });
    });

    it("rejects noise with trailing punctuation", () => {
      expect(classifyNoise("thanks!").allowed).toBe(false);
      expect(classifyNoise("ok.").allowed).toBe(false);
      expect(classifyNoise("cool!").allowed).toBe(false);
    });

    it("rejects noise case-insensitively", () => {
      expect(classifyNoise("THANKS").allowed).toBe(false);
      expect(classifyNoise("Ok").allowed).toBe(false);
      expect(classifyNoise("LOL").allowed).toBe(false);
    });

    it("rejects empty/whitespace-only messages", () => {
      expect(classifyNoise("").allowed).toBe(false);
      expect(classifyNoise("   ").allowed).toBe(false);
    });
  });

  describe("Short message signal detection", () => {
    it("allows short acronyms (likely meaningful)", () => {
      expect(classifyNoise("ETA").allowed).toBe(true);
      expect(classifyNoise("SLA").allowed).toBe(true);
      expect(classifyNoise("P0").allowed).toBe(true);
    });

    it("allows numbers (ticket IDs, amounts)", () => {
      expect(classifyNoise("123").allowed).toBe(true);
      expect(classifyNoise("42").allowed).toBe(true);
    });

    it("rejects very short non-acronyms", () => {
      expect(classifyNoise("hi").allowed).toBe(false);
      expect(classifyNoise("yo").allowed).toBe(false);
    });
  });

  describe("Signal (should pass)", () => {
    it("allows normal work messages", () => {
      expect(
        classifyNoise("Can you review the Q3 budget deck by Friday?").allowed,
      ).toBe(true);
    });

    it("allows messages with action items", () => {
      expect(
        classifyNoise("Please update the Jira ticket with the latest estimates")
          .allowed,
      ).toBe(true);
    });

    it("allows messages with links", () => {
      expect(
        classifyNoise("Check this out: https://docs.google.com/budget").allowed,
      ).toBe(true);
    });

    it("allows questions", () => {
      expect(
        classifyNoise("When is the deadline for the proposal?").allowed,
      ).toBe(true);
    });

    it("allows multi-sentence messages", () => {
      expect(
        classifyNoise("I finished the draft. Let me know if you have feedback.")
          .allowed,
      ).toBe(true);
    });
  });
});

// =============================================================
// SOURCE HASH GENERATION
// =============================================================
describe("generateSourceHash", () => {
  it("generates consistent hashes for same input", () => {
    const a = generateSourceHash("SLACK", "slack://ch1", "hello");
    const b = generateSourceHash("SLACK", "slack://ch1", "hello");
    expect(a).toBe(b);
  });

  it("generates different hashes for different content", () => {
    const a = generateSourceHash("SLACK", "slack://ch1", "hello");
    const b = generateSourceHash("SLACK", "slack://ch1", "world");
    expect(a).not.toBe(b);
  });

  it("generates different hashes for different platforms", () => {
    const a = generateSourceHash("SLACK", "link1", "hello");
    const b = generateSourceHash("GMAIL", "link1", "hello");
    expect(a).not.toBe(b);
  });

  it("returns a valid SHA-256 hex string (64 chars)", () => {
    const hash = generateSourceHash("SLACK", "link", "text");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

// =============================================================
// DEDUPLICATION
// =============================================================
describe("isDuplicate", () => {
  it("returns true if hash exists in DB", async () => {
    const mockDb = {
      sourceEvent: {
        findFirst: vi.fn().mockResolvedValue({ id: "existing-id" }),
      },
    };
    expect(await isDuplicate("some-hash", mockDb)).toBe(true);
    expect(mockDb.sourceEvent.findFirst).toHaveBeenCalledWith({
      where: { sourceHash: "some-hash" },
      select: { id: true },
    });
  });

  it("returns false if hash does not exist", async () => {
    const mockDb = {
      sourceEvent: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    expect(await isDuplicate("new-hash", mockDb)).toBe(false);
  });
});

// =============================================================
// FULL GATEKEEPER PIPELINE
// =============================================================
describe("runGatekeeper", () => {
  const slackSecret = "test-slack-signing-secret";
  const secrets = { slackSigningSecret: slackSecret };

  function makeMockDb(exists: boolean) {
    return {
      sourceEvent: {
        findFirst: vi.fn().mockResolvedValue(exists ? { id: "x" } : null),
      },
    };
  }

  function makeSlackInput(
    text: string,
    overrides?: Partial<GatekeeperInput>,
  ): GatekeeperInput {
    const ts = nowTimestamp();
    const body = JSON.stringify({ text });
    return {
      rawBody: body,
      text,
      platform: "SLACK",
      deepLink: "slack://ch1/msg1",
      slackTimestamp: ts,
      slackSignature: makeSlackSignature(slackSecret, ts, body),
      ...overrides,
    };
  }

  it("passes a valid Slack message through all stages", async () => {
    const input = makeSlackInput("Can you review the budget by Friday?");
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("PASSED");
    expect(result.sourceHash).toBeDefined();
  });

  it("rejects bad HMAC signature", async () => {
    const input = makeSlackInput("Hello", {
      slackSignature: "v0=badbadbadbad",
    });
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("HMAC_FAILED");
  });

  it("rejects missing HMAC headers", async () => {
    const input = makeSlackInput("Hello", {
      slackTimestamp: undefined,
      slackSignature: undefined,
    });
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("HMAC_FAILED");
  });

  it("rejects bot messages after HMAC passes", async () => {
    const input = makeSlackInput("Deploy complete", {
      isBotMessage: true,
    });
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("BOT_MESSAGE");
  });

  it("rejects noise phrases after HMAC passes", async () => {
    const input = makeSlackInput("thanks");
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SHORT_NOISE");
  });

  it("rejects emoji-only after HMAC passes", async () => {
    const input = makeSlackInput("👍");
    const result = await runGatekeeper(input, makeMockDb(false), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("EMOJI_ONLY");
  });

  it("rejects duplicates after noise passes", async () => {
    const input = makeSlackInput("Review the budget deck");
    const result = await runGatekeeper(input, makeMockDb(true), secrets);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("DUPLICATE");
  });

  it("skips HMAC for GMAIL platform", async () => {
    const input: GatekeeperInput = {
      rawBody: "email body",
      text: "Please review the attached proposal",
      sender: "alice@company.com",
      platform: "GMAIL",
      deepLink: "https://mail.google.com/thread/123",
    };
    const result = await runGatekeeper(input, makeMockDb(false), {});
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("PASSED");
  });

  it("rejects JIRA with missing signature", async () => {
    const input: GatekeeperInput = {
      rawBody: '{"issue":"test"}',
      text: "Fix login bug",
      platform: "JIRA",
      deepLink: "https://jira.atlassian.net/PROJ-123",
    };
    const result = await runGatekeeper(input, makeMockDb(false), {
      jiraWebhookSecret: "secret",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("HMAC_FAILED");
  });

  it("pipeline order: HMAC → Noise → Dedup", async () => {
    // This message is noise ("thanks") but also has bad HMAC.
    // HMAC should fail FIRST — noise check never runs.
    const input = makeSlackInput("thanks", {
      slackSignature: "v0=invalid",
    });
    const db = makeMockDb(false);
    const result = await runGatekeeper(input, db, secrets);

    expect(result.reason).toBe("HMAC_FAILED");
    // DB should never be called — we rejected before dedup
    expect(db.sourceEvent.findFirst).not.toHaveBeenCalled();
  });
});
