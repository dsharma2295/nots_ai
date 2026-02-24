// =============================================================
// src/app/api/auth/gmail/route.ts
// Gmail OAuth2 — Step 1: Redirect to Google consent screen.
// Visit this URL in your browser to authorize Nots.ai.
// =============================================================

import { getOAuth2Client } from "@/lib/gmail/client";
import { NextResponse } from "next/server";

export async function GET() {
  const oauth2 = getOAuth2Client();

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline", // Gets a refresh token
    prompt: "consent", // Force consent to always get refresh token
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  return NextResponse.redirect(authUrl);
}
