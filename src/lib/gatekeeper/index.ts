// =============================================================
// src/lib/gatekeeper/index.ts
// The Secure Gatekeeper — First Stage of the Multi-Tier Pipeline
//
// TWO RESPONSIBILITIES:
//   1. HMAC VERIFICATION: Reject unauthorized webhook payloads.
//   2. NOISE FILTERING: Discard bot messages, emoji reactions,
//      and single-word chatter BEFORE calling Gemini.
//
// COST IMPACT: This layer kills ~80% of inbound volume using
// zero AI calls. Everything here is rules-based and free.
//
// SECURITY: Uses timing-safe comparison to prevent timing
// attacks on HMAC signatures. Rejects requests older than
// 5 minutes to prevent replay attacks.
// =============================================================

import {
  GatekeeperResultSchema,
  type GatekeeperResult,
} from "@/lib/validators/schemas";
import crypto from "crypto";

// =============================================================
// HMAC VERIFICATION
// =============================================================

const TIMESTAMP_MAX_AGE_SECONDS = 300; // 5 minutes — Slack's recommendation

/**
 * Verify Slack webhook signature (HMAC-SHA256).
 *
 * Slack sends:
 *   - X-Slack-Request-Timestamp: Unix epoch seconds
 *   - X-Slack-Signature: v0=<hex digest>
 *
 * We reconstruct the signature using:
 *   basestring = "v0:{timestamp}:{rawBody}"
 *   expected = "v0=" + HMAC-SHA256(signingSecret, basestring)
 *
 * Then compare using timing-safe equality.
 */
export function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string,
): boolean {
  // Reject stale requests (replay attack prevention)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);

  if (isNaN(ts) || Math.abs(now - ts) > TIMESTAMP_MAX_AGE_SECONDS) {
    return false;
  }

  // Reconstruct the signature
  const basestring = `v0:${timestamp}:${rawBody}`;
  const expectedSig =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(basestring, "utf8")
      .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSig, "utf8");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify Jira webhook signature (HMAC-SHA256).
 *
 * Jira Cloud sends:
 *   - X-Hub-Signature: sha256=<hex digest>
 *
 * Computed over the raw request body using the webhook secret.
 */
export function verifyJiraSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  if (!signature.startsWith("sha256=")) return false;

  const receivedSig = signature.slice("sha256=".length);
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(receivedSig, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify Gmail Pub/Sub push notification.
 *
 * Gmail uses OAuth2 + Google Cloud Pub/Sub, which authenticates
 * via the subscription's push endpoint configuration (not HMAC).
 * Verification = check that the subscription name matches yours.
 * For extra security, validate the JWT bearer token from Google.
 *
 * This is a lightweight check — full JWT verification can be
 * added later when you integrate Google Auth Library.
 */
export function verifyGmailPush(
  subscription: string,
  expectedSubscription: string,
): boolean {
  return subscription === expectedSubscription;
}

// =============================================================
// NOISE FILTERING
// Rule-based classification that runs BEFORE any AI call.
// =============================================================

// Bot indicators: Slack bot_id, common bot usernames, automated senders
const BOT_INDICATORS = [
  "bot_id",
  "B0", // Slack bot IDs start with B
  "slackbot",
  "jira-bot",
  "github-bot",
  "dependabot",
  "renovate",
  "noreply",
  "no-reply",
  "automated",
  "mailer-daemon",
] as const;

// Emoji-only: messages that are purely emoji reactions
const EMOJI_PATTERN =
  /^[\s\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Presentation}]+$/u;

// Short noise: messages that are conversational filler
const NOISE_PHRASES = new Set([
  "thanks",
  "thank you",
  "thx",
  "ty",
  "ok",
  "okay",
  "k",
  "got it",
  "sounds good",
  "lol",
  "lmao",
  "haha",
  "yes",
  "no",
  "yep",
  "nope",
  "cool",
  "nice",
  "great",
  "sure",
  "np",
  "no problem",
  "will do",
  "done",
  "ack",
  "noted",
  "👍",
  "👎",
  "🙏",
  "✅",
  "+1",
  ":-)",
  ":)",
  ":thumbsup:",
  ":+1:",
  ":white_check_mark:",
]);

/**
 * Classify a message as noise or signal.
 * Returns a GatekeeperResult with the classification.
 *
 * Classification order (cheapest checks first):
 *   1. Bot detection (string matching)
 *   2. Emoji-only detection (regex)
 *   3. Short noise phrase detection (Set lookup)
 *   4. PASS — message is signal, forward to Refiner
 */
export function classifyNoise(
  text: string,
  sender?: string,
  isBotMessage?: boolean,
  customNoiseKeywords?: string[],
): GatekeeperResult {
  // 1. Bot detection
  if (isBotMessage) {
    return makeResult(false, "BOT_MESSAGE");
  }

  if (sender) {
    const senderLower = sender.toLowerCase();
    for (const indicator of BOT_INDICATORS) {
      if (senderLower.includes(indicator.toLowerCase())) {
        return makeResult(false, "BOT_MESSAGE");
      }
    }
  }

  // 2. Emoji-only (skip if text is just digits/ASCII — Unicode classifies 0-9 as Emoji)
  const trimmed = text.trim();
  if (
    trimmed.length > 0 &&
    !/^[\d\sa-zA-Z]+$/.test(trimmed) &&
    EMOJI_PATTERN.test(trimmed)
  ) {
    return makeResult(false, "EMOJI_ONLY");
  }

  // 3. Short noise phrases
  const normalized = trimmed.toLowerCase().replace(/[.!?,;:]+$/g, "");
  if (normalized.length === 0) {
    return makeResult(false, "SHORT_NOISE");
  }

  if (NOISE_PHRASES.has(normalized)) {
    return makeResult(false, "SHORT_NOISE");
  }

  // User-defined custom noise keywords from Settings
  if (customNoiseKeywords && customNoiseKeywords.length > 0) {
    for (const kw of customNoiseKeywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return makeResult(false, "CUSTOM_NOISE_KEYWORD");
      }
    }
  }

  // Messages under 4 characters that aren't in our allowed set
  // are almost certainly noise
  if (normalized.length < 4 && !isLikelySignal(trimmed)) {
    return makeResult(false, "SHORT_NOISE");
  }

  // 4. PASSED — this is signal
  return makeResult(true, "PASSED");
}

/**
 * Check if a very short message might still be signal.
 * e.g., "ETA", "SLA", "P0", "ACL" are meaningful acronyms.
 */
function isLikelySignal(text: string): boolean {
  // All uppercase short strings are likely acronyms
  if (text === text.toUpperCase() && /^[A-Z0-9]+$/.test(text)) {
    return true;
  }
  // Numbers (could be ticket IDs, amounts)
  if (/^\d+$/.test(text)) {
    return true;
  }
  return false;
}

/**
 * Generate a source hash for idempotency.
 * SHA-256 of platform + deepLink + content.
 */
export function generateSourceHash(
  platform: string,
  deepLink: string,
  rawContent: string,
): string {
  const input = `${platform}:${deepLink}:${rawContent}`;
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Check if a source hash already exists in the database.
 * Returns true if it's a duplicate (should be rejected).
 */
export async function isDuplicate(
  sourceHash: string,
  db: {
    sourceEvent: {
      findFirst: (args: {
        where: { sourceHash: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
): Promise<boolean> {
  const existing = await db.sourceEvent.findFirst({
    where: { sourceHash },
    select: { id: true },
  });
  return existing !== null;
}

// =============================================================
// FULL GATEKEEPER PIPELINE
// Runs all checks in sequence. Returns on first failure.
// =============================================================

export interface GatekeeperInput {
  rawBody: string;
  text: string;
  sender?: string;
  isBotMessage?: boolean;
  platform: string;
  deepLink: string;
  // HMAC fields (platform-specific)
  slackTimestamp?: string;
  slackSignature?: string;
  jiraSignature?: string;
}

export async function runGatekeeper(
  input: GatekeeperInput,
  db: {
    sourceEvent: {
      findFirst: (args: {
        where: { sourceHash: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  secrets: {
    slackSigningSecret?: string;
    jiraWebhookSecret?: string;
  },
): Promise<GatekeeperResult> {
  // STEP 1: HMAC verification (platform-specific)
  if (input.platform === "SLACK") {
    if (
      !input.slackTimestamp ||
      !input.slackSignature ||
      !secrets.slackSigningSecret
    ) {
      return makeResult(false, "HMAC_FAILED");
    }
    if (
      !verifySlackSignature(
        input.rawBody,
        input.slackTimestamp,
        input.slackSignature,
        secrets.slackSigningSecret,
      )
    ) {
      return makeResult(false, "HMAC_FAILED");
    }
  }

  if (input.platform === "JIRA") {
    if (!input.jiraSignature || !secrets.jiraWebhookSecret) {
      return makeResult(false, "HMAC_FAILED");
    }
    if (
      !verifyJiraSignature(
        input.rawBody,
        input.jiraSignature,
        secrets.jiraWebhookSecret,
      )
    ) {
      return makeResult(false, "HMAC_FAILED");
    }
  }

  // STEP 2: Noise classification
  const noiseResult = classifyNoise(
    input.text,
    input.sender,
    input.isBotMessage,
  );
  if (!noiseResult.allowed) {
    return noiseResult;
  }

  // STEP 3: Deduplication
  const sourceHash = generateSourceHash(
    input.platform,
    input.deepLink,
    input.text,
  );

  const duplicate = await isDuplicate(sourceHash, db);
  if (duplicate) {
    return makeResult(false, "DUPLICATE", sourceHash);
  }

  // ALL CHECKS PASSED — forward to Refiner
  return makeResult(true, "PASSED", sourceHash);
}

// =============================================================
// HELPER
// =============================================================

function makeResult(
  allowed: boolean,
  reason: GatekeeperResult["reason"],
  sourceHash?: string,
): GatekeeperResult {
  return GatekeeperResultSchema.parse({ allowed, reason, sourceHash });
}
