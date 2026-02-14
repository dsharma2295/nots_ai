// =============================================================
// src/app/api/webhooks/slack/route.ts
// Slack Events API Webhook Endpoint
//
// This is the entry point for ALL Slack events into Nots.ai.
// It handles:
//   1. URL verification challenge (Slack sends this once on setup)
//   2. Event deduplication (Slack retries aggressively)
//   3. HMAC signature verification via the Gatekeeper
//   4. Noise filtering via the Gatekeeper
//   5. Dispatching to Inngest for async processing
//
// IMPORTANT: Must respond within 3 seconds or Slack retries.
// All heavy processing happens in Inngest, not here.
// =============================================================

import { inngest } from "@/inngest/client";
import db from "@/lib/db";
import {
  classifyNoise,
  generateSourceHash,
  isDuplicate,
  verifySlackSignature,
} from "@/lib/gatekeeper";
import { NextRequest, NextResponse } from "next/server";

// Disable body parsing — we need the raw body for HMAC verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Read raw body ONCE — needed for both HMAC and parsing
    const rawBody = await req.text();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // STEP 1: URL Verification Challenge
    // Slack sends this once when you set the Request URL.
    // Must respond with the challenge value immediately.
    // ---------------------------------------------------------
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // ---------------------------------------------------------
    // STEP 2: HMAC Signature Verification
    // ---------------------------------------------------------
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[Slack Webhook] SLACK_SIGNING_SECRET not set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
    const signature = req.headers.get("x-slack-signature") ?? "";

    if (!verifySlackSignature(rawBody, timestamp, signature, signingSecret)) {
      console.warn("[Slack Webhook] HMAC verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ---------------------------------------------------------
    // STEP 3: Parse the event
    // ---------------------------------------------------------
    if (body.type !== "event_callback") {
      // Not an event we care about (e.g., app_rate_limited)
      return NextResponse.json({ ok: true });
    }

    const event = body.event as Record<string, unknown> | undefined;
    if (!event) {
      return NextResponse.json({ ok: true });
    }

    const eventType = event.type as string;
    const text = (event.text as string) ?? "";
    const user = (event.user as string) ?? "";
    const channel = (event.channel as string) ?? "";
    const ts = (event.ts as string) ?? "";
    const botId = event.bot_id as string | undefined;
    const threadTs = event.thread_ts as string | undefined;
    const subtype = event.subtype as string | undefined;

    // Ignore messages from bots (including our own)
    if (botId) {
      return NextResponse.json({ ok: true });
    }

    // Only process message events and app_mention
    if (eventType !== "message" && eventType !== "app_mention") {
      return NextResponse.json({ ok: true });
    }

    // Ignore message subtypes (edits, deletes, joins, leaves, etc.)
    const IGNORED_SUBTYPES = new Set([
      "message_changed",
      "message_deleted",
      "channel_join",
      "channel_leave",
      "channel_topic",
      "channel_purpose",
      "channel_name",
      "bot_message",
      "pinned_item",
      "unpinned_item",
    ]);

    if (subtype && IGNORED_SUBTYPES.has(subtype)) {
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // RELEVANCE FILTER
    // Only process messages relevant to the TARGET user.
    // A message is relevant if:
    //   1. It @mentions the target user (e.g. <@U0ADGL60FGE>)
    //   2. It's a DM to the bot (channel type = "im")
    //   3. It's an app_mention event
    //   4. It's a thread reply to the target user's message
    //   5. It mentions the target user's name textually
    //
    // Everything else is someone else's conversation — ignore it.
    // ---------------------------------------------------------
    const targetUserId = process.env.SLACK_TARGET_USER_ID ?? "";
    const targetUserNames = (process.env.SLACK_TARGET_USER_NAMES ?? "")
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    const channelType = (event.channel_type as string) ?? "";
    const isDirectMessage = channelType === "im";
    const isAppMention = eventType === "app_mention";
    const mentionsTargetUser = text.includes(`<@${targetUserId}>`);
    const mentionsTargetName = targetUserNames.some((name) =>
      text.toLowerCase().includes(name),
    );
    // Thread replies: if someone replies in a thread the target user started
    const isThreadReply = !!threadTs && threadTs !== ts;

    const isRelevant =
      isDirectMessage ||
      isAppMention ||
      mentionsTargetUser ||
      mentionsTargetName ||
      isThreadReply; // Thread replies get processed — we check authorship in the pipeline

    if (!isRelevant) {
      return NextResponse.json({ ok: true, skipped: "not_relevant" });
    }

    // ---------------------------------------------------------
    // STEP 7: Extract attachments (Slack files)
    // Must happen before text processing since file-only
    // messages need filenames to construct content.
    // ---------------------------------------------------------
    const files =
      (event.files as Array<{
        name?: string;
        url_private?: string;
        mimetype?: string;
        size?: number;
      }>) ?? [];

    const attachments = files
      .filter((f) => f.name && f.url_private)
      .map((f) => ({
        name: f.name!,
        url: f.url_private!,
        mimeType: f.mimetype,
        size: f.size,
      }));

    // Enrich text with attachment filenames so the Refiner
    // has full context about what was shared.
    //
    // Three scenarios:
    //   1. No text, has files → "Shared: budget.xlsx"
    //   2. Text is just @mentions, has files → "@U123 — Shared: budget.xlsx"
    //   3. Real text + files → "Review this [Attachments: budget.xlsx]"
    //   4. Real text, no files → unchanged

    const hasFiles = files.length > 0;
    let messageText = text.trim();

    if (hasFiles) {
      const fileNames = files.map((f) => f.name ?? "unnamed file").join(", ");

      const textWithoutMentions = messageText
        .replace(/<@[A-Z0-9]+>/g, "")
        .trim();

      if (!messageText) {
        // Scenario 1: file-only, no text at all
        messageText = `Shared: ${fileNames}`;
      } else if (!textWithoutMentions) {
        // Scenario 2: text is only @mentions
        messageText = `${messageText} — Shared: ${fileNames}`;
      } else {
        // Scenario 3: real text + files
        messageText = `${messageText} [Attachments: ${fileNames}]`;
      }
    }

    // Skip truly empty messages (no text, no files)
    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    // Truncate very long messages to prevent downstream issues
    const truncatedText =
      messageText.length > 5000
        ? messageText.slice(0, 5000) + "... [truncated]"
        : messageText;

    // Strip Slack mrkdwn user mentions like <@U12345> to readable format
    const cleanedText = truncatedText.replace(/<@[A-Z0-9]+>/g, (match) => {
      const userId = match.slice(2, -1);
      return `@${userId}`;
    });

    // ---------------------------------------------------------
    // STEP 4: Noise Filter
    // ---------------------------------------------------------
    const noiseResult = classifyNoise(cleanedText, user, false);
    if (!noiseResult.allowed) {
      return NextResponse.json({ ok: true, filtered: noiseResult.reason });
    }

    // ---------------------------------------------------------
    // STEP 5: Deduplication
    // ---------------------------------------------------------
    const teamId = (body.team_id as string) ?? "";
    const deepLink = `slack://channel?team=${teamId}&id=${channel}&message=${ts}`;
    const sourceHash = generateSourceHash("SLACK", deepLink, cleanedText);

    const duplicate = await isDuplicate(sourceHash, db);
    if (duplicate) {
      return NextResponse.json({ ok: true, filtered: "DUPLICATE" });
    }

    // ---------------------------------------------------------
    // STEP 6: Resolve user info (optional — for sender name)
    // We use the bot token to look up the user's display name.
    // If it fails, we fall back to the user ID.
    // ---------------------------------------------------------
    let senderName = user;
    const botToken = process.env.SLACK_BOT_TOKEN;
    if (botToken) {
      try {
        const userRes = await fetch(
          `https://slack.com/api/users.info?user=${user}`,
          {
            headers: { Authorization: `Bearer ${botToken}` },
          },
        );
        const userData = (await userRes.json()) as {
          ok: boolean;
          user?: { real_name?: string; profile?: { display_name?: string } };
        };
        if (userData.ok && userData.user) {
          senderName =
            userData.user.profile?.display_name ||
            userData.user.real_name ||
            user;
        }
      } catch {
        // Non-critical — fall back to user ID
      }
    }

    // ---------------------------------------------------------
    // STEP 8: Dispatch to Inngest
    // This returns immediately — processing happens in background.
    // Must respond to Slack within 3 seconds.
    // ---------------------------------------------------------

    // For now, we use a hardcoded user ID.
    // When OAuth is fully wired, this comes from the user's session.
    // TODO: Replace with real user lookup from Slack team_id → Nots.ai user
    let notsUser = await db.user.findFirst({
      where: { email: `slack-${teamId}@nots.ai` },
    });

    if (!notsUser) {
      notsUser = await db.user.create({
        data: {
          email: `slack-${teamId}@nots.ai`,
          name: `Slack Workspace ${teamId}`,
        },
      });
    }

    await inngest.send({
      name: "nots/message.received",
      data: {
        task: {
          platform: "SLACK" as const,
          rawContent: cleanedText,
          sender: senderName,
          deepLink,
          timestamp: new Date(parseFloat(ts) * 1000).toISOString(),
          sourceHash,
          attachments,
        },
        userId: notsUser.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Slack Webhook] Unhandled error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
