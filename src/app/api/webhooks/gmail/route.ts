// =============================================================
// src/app/api/webhooks/gmail/route.ts
// Gmail Pub/Sub Webhook Endpoint
//
// Google Pub/Sub pushes a notification here when new email arrives.
// The notification does NOT contain the email content — just a
// historyId telling us something changed. We then fetch the
// actual emails via the Gmail API.
//
// FLOW:
//   1. Pub/Sub pushes notification → this endpoint
//   2. We decode the notification to get historyId
//   3. We fetch new messages since last historyId
//   4. For each new message, we fetch full content
//   5. Apply Tier 1 filtering (Primary only, skip noreply, etc.)
//   6. Dispatch to Inngest pipeline
// =============================================================

import { inngest } from "@/inngest/client";
import db from "@/lib/db";
import {
  classifyNoise,
  generateSourceHash,
  isDuplicate,
} from "@/lib/gatekeeper";
import { fetchEmail, getAuthenticatedClient } from "@/lib/gmail/client";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

// Store last processed historyId in memory
// In production, store this in the database
let lastHistoryId: string | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ---------------------------------------------------------
    // STEP 1: Decode Pub/Sub notification
    // ---------------------------------------------------------
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json({ ok: true });
    }

    const decoded = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf8"),
    );

    const emailAddress = decoded.emailAddress as string;
    const newHistoryId = decoded.historyId as string;

    // Verify this is for our target email
    const targetEmail = process.env.GMAIL_TARGET_EMAIL;
    if (targetEmail && emailAddress !== targetEmail) {
      return NextResponse.json({ ok: true, skipped: "wrong_email" });
    }

    // ---------------------------------------------------------
    // STEP 2: Fetch new messages since last historyId
    // ---------------------------------------------------------
    const { oauth2, userId: notsUserId } = await getAuthenticatedClient();
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    let messageIds: string[] = [];

    if (lastHistoryId) {
      try {
        const history = await gmail.users.history.list({
          userId: "me",
          startHistoryId: lastHistoryId,
          historyTypes: ["messageAdded"],
          labelId: "INBOX",
        });

        messageIds = (history.data.history ?? [])
          .flatMap((h) => h.messagesAdded ?? [])
          .map((m) => m.message?.id)
          .filter((id): id is string => !!id);
      } catch {
        // History expired — fall back to listing recent messages
        console.warn("[Gmail] History expired, listing recent messages");
        const list = await gmail.users.messages.list({
          userId: "me",
          maxResults: 5,
          labelIds: ["INBOX"],
          q: "is:unread",
        });
        messageIds = (list.data.messages ?? [])
          .map((m) => m.id)
          .filter((id): id is string => !!id);
      }
    } else {
      // First run — get recent unread messages
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults: 5,
        labelIds: ["INBOX"],
        q: "is:unread",
      });
      messageIds = (list.data.messages ?? [])
        .map((m) => m.id)
        .filter((id): id is string => !!id);
    }

    // Update historyId for next notification
    lastHistoryId = newHistoryId;

    if (messageIds.length === 0) {
      return NextResponse.json({ ok: true, messages: 0 });
    }

    // ---------------------------------------------------------
    // STEP 3: Process each new message
    // ---------------------------------------------------------
    let processed = 0;

    for (const msgId of messageIds) {
      const email = await fetchEmail(msgId);
      if (!email) continue;

      // TIER 1 FILTER: Skip non-Primary emails
      // Gmail labels: CATEGORY_PERSONAL = Primary
      const isPrimary =
        email.labels.includes("CATEGORY_PERSONAL") ||
        !email.labels.some((l: string) => l.startsWith("CATEGORY_"));

      if (!isPrimary) {
        continue; // Skip promotions, social, updates, forums
      }

      // Skip unsubscribe emails (marketing/newsletters)
      if (email.hasUnsubscribe) {
        continue;
      }

      // Skip noreply senders
      const senderLower = email.from.toLowerCase();
      if (
        senderLower.includes("noreply") ||
        senderLower.includes("no-reply") ||
        senderLower.includes("mailer-daemon")
      ) {
        continue;
      }

      // Build the text content for processing
      const content =
        email.subject !== "(No Subject)"
          ? `Subject: ${email.subject}\n\n${email.body}`
          : email.body;

      // Enrich with attachment filenames
      let enrichedContent = content;
      if (email.attachments.length > 0) {
        const fileNames = email.attachments
          .map((a: { filename: string }) => a.filename)
          .join(", ");
        enrichedContent = `${content} [Attachments: ${fileNames}]`;
      }

      // TIER 2 FILTER: Noise check
      const noiseResult = classifyNoise(enrichedContent, email.from);
      if (!noiseResult.allowed) {
        continue;
      }

      // Deduplication
      const deepLink = `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`;
      const sourceHash = generateSourceHash("GMAIL", deepLink, enrichedContent);

      const duplicate = await isDuplicate(sourceHash, db);
      if (duplicate) {
        continue;
      }

      // Build attachments array
      const attachments = email.attachments.map(
        (a: { filename: string; mimeType: string; size: number }) => ({
          name: a.filename,
          url: `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`,
          mimeType: a.mimeType,
          size: a.size,
        }),
      );

      // Dispatch to Inngest
      await inngest.send({
        name: "nots/message.received",
        data: {
          task: {
            platform: "GMAIL" as const,
            rawContent: enrichedContent,
            sender: email.from,
            deepLink,
            timestamp: new Date(email.date).toISOString(),
            sourceHash,
            attachments,
          },
          userId: notsUserId,
        },
      });

      processed++;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error("[Gmail Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
