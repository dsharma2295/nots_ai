// =============================================================
// src/app/api/webhooks/gmail/route.ts
// Gmail Pub/Sub Webhook Endpoint
//
// CHANGELOG v1.2:
// - Passes threadId (Gmail conversation thread ID) to Inngest
//   for deterministic merge in the pipeline (Stage 1).
// - Stores Message-ID and In-Reply-To in metadata for audit trail.
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

let lastHistoryId: string | null = null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Decode Pub/Sub notification
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json({ ok: true });
    }

    const decoded = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf8"),
    );

    const emailAddress = decoded.emailAddress as string;
    const newHistoryId = decoded.historyId as string;

    const targetEmail = process.env.GMAIL_TARGET_EMAIL;
    if (targetEmail && emailAddress !== targetEmail) {
      return NextResponse.json({ ok: true, skipped: "wrong_email" });
    }

    // Fetch new messages
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

    lastHistoryId = newHistoryId;

    if (messageIds.length === 0) {
      return NextResponse.json({ ok: true, messages: 0 });
    }

    // Process each new message
    let processed = 0;

    for (const msgId of messageIds) {
      const email = await fetchEmail(msgId);
      if (!email) continue;

      // TIER 1 FILTER: Skip non-Primary emails
      const isPrimary =
        email.labels.includes("CATEGORY_PERSONAL") ||
        !email.labels.some((l) => l.startsWith("CATEGORY_"));

      if (!isPrimary) continue;

      if (email.hasUnsubscribe) continue;

      const senderLower = email.from.toLowerCase();
      if (
        senderLower.includes("noreply") ||
        senderLower.includes("no-reply") ||
        senderLower.includes("mailer-daemon")
      ) {
        continue;
      }

      // Build text content
      const content =
        email.subject !== "(No Subject)"
          ? `Subject: ${email.subject}\n\n${email.body}`
          : email.body;

      // Attachments passed separately — don't pollute rawContent
      const enrichedContent = content;

      // TIER 2 FILTER: Noise check
      const noiseResult = classifyNoise(enrichedContent, email.from);
      if (!noiseResult.allowed) continue;

      // Deduplication
      const gmailUser = encodeURIComponent(targetEmail || "me");
      const deepLink = `https://mail.google.com/mail/u/?authuser=${gmailUser}#inbox/${email.threadId}`;
      const sourceHash = generateSourceHash("GMAIL", deepLink, enrichedContent);

      const duplicate = await isDuplicate(sourceHash, db);
      if (duplicate) continue;

      // Build attachments array
      const attachments = email.attachments.map((a) => ({
        name: a.filename,
        url: `https://mail.google.com/mail/u/?authuser=${gmailUser}#inbox/${email.threadId}`,
        mimeType: a.mimeType,
        size: a.size,
      }));

      // ─── DISPATCH TO INNGEST ─────────────────────────────
      // Now includes threadId for Stage 1 merge and
      // messageId/inReplyTo in metadata for audit trail.
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
            // Stage 1: Gmail threadId — all emails in a conversation share this
            threadId: email.threadId,
            // Stage 2: not needed for Gmail — threadId is definitive
            channelId: undefined,
            // Audit trail: store email threading headers
            metadata: {
              gmailMessageId: email.messageId,
              inReplyTo: email.inReplyTo || undefined,
            },
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
