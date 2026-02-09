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

    // Ignore messages from bots (including our own)
    if (botId) {
      return NextResponse.json({ ok: true });
    }

    // Only process message events and app_mention
    if (eventType !== "message" && eventType !== "app_mention") {
      return NextResponse.json({ ok: true });
    }

    // Ignore message subtypes (edits, deletes, joins, etc.)
    if (event.subtype) {
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // STEP 4: Noise Filter
    // ---------------------------------------------------------
    const noiseResult = classifyNoise(text, user, false);
    if (!noiseResult.allowed) {
      return NextResponse.json({ ok: true, filtered: noiseResult.reason });
    }

    // ---------------------------------------------------------
    // STEP 5: Deduplication
    // ---------------------------------------------------------
    const teamId = (body.team_id as string) ?? "";
    const deepLink = `slack://channel?team=${teamId}&id=${channel}&message=${ts}`;
    const sourceHash = generateSourceHash("SLACK", deepLink, text);

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
    // STEP 7: Extract attachments (Slack files)
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
          rawContent: text,
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
