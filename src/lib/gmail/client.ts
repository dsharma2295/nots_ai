// =============================================================
// src/lib/gmail/client.ts
// Gmail OAuth2 client + email fetching utilities.
//
// Uses Google's official googleapis library.
// Tokens are stored in the database (User model).
// =============================================================

import db from "@/lib/db";
import { google } from "googleapis";

// =============================================================
// OAUTH CLIENT
// =============================================================

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://nots-ai-mobi.vercel.app"}/api/auth/gmail/callback`,
  );
}

/**
 * Get an authenticated OAuth2 client with stored tokens.
 * Automatically refreshes expired access tokens.
 */
export async function getAuthenticatedClient() {
  const targetEmail = process.env.GMAIL_TARGET_EMAIL;
  if (!targetEmail) throw new Error("GMAIL_TARGET_EMAIL not set");

  const user = await db.user.findFirst({
    where: { email: targetEmail },
  });

  if (!user?.gmailTokenEnc) {
    throw new Error(
      `No Gmail tokens found for ${targetEmail}. Complete the OAuth flow first: /api/auth/gmail`,
    );
  }

  const tokens = JSON.parse(user.gmailTokenEnc);
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials(tokens);

  // Auto-refresh if expired
  oauth2.on("tokens", async (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    await db.user.update({
      where: { id: user.id },
      data: { gmailTokenEnc: JSON.stringify(merged) },
    });
  });

  return { oauth2, userId: user.id };
}

// =============================================================
// EMAIL FETCHING
// =============================================================

export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
  hasUnsubscribe: boolean;
  attachments: { filename: string; mimeType: string; size: number }[];
}

/**
 * Fetch and parse a single email by ID.
 */
export async function fetchEmail(
  messageId: string,
): Promise<ParsedEmail | null> {
  try {
    const { oauth2 } = await getAuthenticatedClient();
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const msg = res.data;
    if (!msg) return null;

    const headers = msg.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const subject = getHeader("Subject") || "(No Subject)";
    const from = getHeader("From");
    const to = getHeader("To");
    const date = getHeader("Date");
    const hasUnsubscribe = headers.some(
      (h) => h.name?.toLowerCase() === "list-unsubscribe",
    );

    // Extract body text
    const body = extractBody(msg.payload) || msg.snippet || "";

    // Extract attachment metadata (not content — just names/types)
    const attachments: ParsedEmail["attachments"] = [];
    extractAttachments(msg.payload, attachments);

    return {
      id: msg.id ?? messageId,
      threadId: msg.threadId ?? "",
      subject,
      from,
      to,
      date,
      snippet: msg.snippet ?? "",
      body: body.slice(0, 5000), // Truncate for token limits
      labels: (msg.labelIds as string[]) ?? [],
      hasUnsubscribe,
      attachments,
    };
  } catch (error) {
    console.error(`[Gmail] Failed to fetch email ${messageId}:`, error);
    return null;
  }
}

/**
 * Extract plain text body from email payload.
 * Handles multipart messages recursively.
 */
function extractBody(
  payload: ReturnType<typeof google.gmail>["users"]["messages"] extends never
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
): string {
  if (!payload) return "";

  // Direct text body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  // Multipart — recurse into parts, prefer text/plain
  if (payload.parts) {
    // First try text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf8");
      }
    }
    // Then try recursing into nested multiparts
    for (const part of payload.parts) {
      const result = extractBody(part);
      if (result) return result;
    }
  }

  return "";
}

/**
 * Extract attachment metadata from email payload.
 */
function extractAttachments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  results: ParsedEmail["attachments"],
) {
  if (!payload) return;

  if (payload.filename && payload.body?.attachmentId) {
    results.push({
      filename: payload.filename,
      mimeType: payload.mimeType ?? "application/octet-stream",
      size: payload.body.size ?? 0,
    });
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      extractAttachments(part, results);
    }
  }
}

// =============================================================
// GMAIL WATCH (Pub/Sub)
// Sets up push notifications for new emails.
// Must be renewed every 7 days.
// =============================================================

export async function setupGmailWatch() {
  const { oauth2 } = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const topicName = process.env.GOOGLE_PUBSUB_TOPIC;
  if (!topicName) throw new Error("GOOGLE_PUBSUB_TOPIC not set");

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
      labelFilterBehavior: "INCLUDE",
    },
  });

  console.log("[Gmail] Watch established:", res.data);
  return res.data;
}
