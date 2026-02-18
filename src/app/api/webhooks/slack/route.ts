// =============================================================
// src/app/api/webhooks/slack/route.ts
// Slack Events API Webhook Endpoint
//
// CHANGELOG v1.2:
// - Passes threadId (thread_ts) and channelId to Inngest payload
//   for deterministic merge in the pipeline.
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

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // URL Verification Challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // HMAC Signature Verification
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

    // Parse the event
    if (body.type !== "event_callback") {
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

    // Ignore messages from bots
    if (botId) {
      return NextResponse.json({ ok: true });
    }

    // Only process message events and app_mention
    if (eventType !== "message" && eventType !== "app_mention") {
      return NextResponse.json({ ok: true });
    }

    // Ignore message subtypes
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

    // Relevance filter
    const targetUserId = process.env.SLACK_TARGET_USER_ID ?? "";
    const targetUserNames = (process.env.SLACK_TARGET_USER_NAMES ?? "")
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    const channelType = (event.channel_type as string) ?? "";
    const botToken = process.env.SLACK_BOT_TOKEN;
    const isDirectMessage = channelType === "im";
    const isAppMention = eventType === "app_mention";
    const mentionsTargetUser = text.includes(`<@${targetUserId}>`);
    const mentionsTargetName = targetUserNames.some((name) =>
      text.toLowerCase().includes(name),
    );
    const isThreadReply = !!threadTs && threadTs !== ts;

    const isRelevant =
      isDirectMessage ||
      isAppMention ||
      mentionsTargetUser ||
      mentionsTargetName ||
      isThreadReply;

    if (!isRelevant) {
      return NextResponse.json({ ok: true, skipped: "not_relevant" });
    }

    // Extract attachments
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

    // Enrich text
    const hasFiles = files.length > 0;
    let messageText = text.trim();

    if (hasFiles) {
      const fileNames = files.map((f) => f.name ?? "unnamed file").join(", ");

      const textWithoutMentions = messageText
        .replace(/<@[A-Z0-9]+>/g, "")
        .trim();

      if (!messageText) {
        messageText = `Shared: ${fileNames}`;
      } else if (!textWithoutMentions) {
        messageText = `${messageText} — Shared: ${fileNames}`;
      }
      // Scenario 3: real text + files — attachments passed separately, don't pollute rawContent
    }

    // Skip empty messages
    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    // Truncate
    const truncatedText =
      messageText.length > 5000
        ? messageText.slice(0, 5000) + "... [truncated]"
        : messageText;

    // Resolve @mentions to display names
    let cleanedText = truncatedText;
    const mentionPattern = /<@([A-Z0-9]+)>/g;
    const mentions = [...truncatedText.matchAll(mentionPattern)];

    if (mentions.length > 0 && botToken) {
      const nameCache: Record<string, string> = {};
      for (const match of mentions) {
        const uid = match[1];
        if (!nameCache[uid]) {
          try {
            const res = await fetch(
              `https://slack.com/api/users.info?user=${uid}`,
              { headers: { Authorization: `Bearer ${botToken}` } },
            );
            const data = (await res.json()) as {
              ok: boolean;
              user?: {
                real_name?: string;
                profile?: { display_name?: string };
              };
            };
            if (data.ok && data.user) {
              nameCache[uid] =
                data.user.profile?.display_name || data.user.real_name || uid;
            } else {
              nameCache[uid] = uid;
            }
          } catch {
            nameCache[uid] = uid;
          }
        }
        cleanedText = cleanedText.replace(
          new RegExp(`<@${uid}>`, "g"),
          `@${nameCache[uid]}`,
        );
      }
    } else {
      cleanedText = truncatedText.replace(
        /<@([A-Z0-9]+)>/g,
        (_, uid) => `@${uid}`,
      );
    }

    // Noise filter
    // Option B (S6): If noise but has threadTs, send through with flag
    // so process-message can touch the task's updatedAt without adding to provenance.
    const noiseResult = classifyNoise(cleanedText, user, false);
    const isNoiseInThread = !noiseResult.allowed && !!threadTs;

    if (!noiseResult.allowed && !isNoiseInThread) {
      return NextResponse.json({ ok: true, filtered: noiseResult.reason });
    }

    // Deduplication
    const teamId = (body.team_id as string) ?? "";
    const deepLink = `slack://channel?team=${teamId}&id=${channel}&message=${ts}`;
    const sourceHash = generateSourceHash("SLACK", deepLink, cleanedText);

    const duplicate = await isDuplicate(sourceHash, db);
    if (duplicate) {
      return NextResponse.json({ ok: true, filtered: "DUPLICATE" });
    }

    // Resolve user info
    let senderName = user;

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

    // Resolve Nots.ai user
    const primaryEmail =
      process.env.GMAIL_TARGET_EMAIL ?? `slack-${teamId}@nots.ai`;

    let notsUser = await db.user.findFirst({
      where: { email: primaryEmail },
    });

    if (!notsUser) {
      notsUser = await db.user.create({
        data: {
          email: primaryEmail,
          name: senderName,
        },
      });
    }

    // ─── DISPATCH TO INNGEST ─────────────────────────────
    // Now includes threadId and channelId for Stage 1 & 2 merge
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
          // Stage 1: Thread linking
          // Reply: threadTs = parent's ts → same value as parent stored
          // New message: no threadTs → store ts so future replies find it
          // Both parent and reply end up with the same threadId value.
          threadId: threadTs ?? ts,
          // Stage 2: Channel context for sender+time heuristic
          channelId: channel,
          // Option B: If noise in thread, flag for process-message
          metadata: isNoiseInThread ? { noiseInThread: true } : undefined,
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
