// =============================================================
// src/app/api/auth/gmail/callback/route.ts
// Gmail OAuth2 — Step 2: Handle Google's redirect.
// Exchanges the auth code for tokens, stores them, sets up watch.
// =============================================================

import db from "@/lib/db";
import { getOAuth2Client, setupGmailWatch } from "@/lib/gmail/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `OAuth denied: ${error}` },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 },
    );
  }

  try {
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    const targetEmail = process.env.GMAIL_TARGET_EMAIL;
    if (!targetEmail) {
      return NextResponse.json(
        { error: "GMAIL_TARGET_EMAIL not set" },
        { status: 500 },
      );
    }

    // Find or create the user
    let user = await db.user.findFirst({
      where: { email: targetEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: targetEmail,
          name: "Gmail User",
        },
      });
    }

    // Store tokens (in production, encrypt these with AES-256)
    await db.user.update({
      where: { id: user.id },
      data: { gmailTokenEnc: JSON.stringify(tokens) },
    });

    // Set up Gmail push notifications via Pub/Sub
    try {
      await setupGmailWatch();
    } catch (watchError) {
      console.error("[Gmail] Watch setup failed:", watchError);
      // Non-fatal — tokens are stored, watch can be set up later
    }

    // Redirect to dashboard
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://nots-ai-mobi.vercel.app";
    return NextResponse.redirect(`${appUrl}?gmail=connected`);
  } catch (err) {
    console.error("[Gmail OAuth] Token exchange failed:", err);
    return NextResponse.json(
      { error: "Failed to exchange authorization code" },
      { status: 500 },
    );
  }
}
