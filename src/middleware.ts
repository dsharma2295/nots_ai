import { NextRequest, NextResponse } from "next/server";

// =============================================================
// Nots.ai — Edge Middleware
//
// Runs before every request. Handles:
//   1. Rate limiting on the AI query endpoint (Gemini costs quota)
//   2. Pass-through for everything else
//
// In-memory sliding window rate limiter.
// No external service, no new dependencies.
//
// Limits:
//   /api/ai/query    → 10 requests / 60 seconds per IP
//   Everything else  → no limit (webhooks use HMAC, dashboard is personal)
// =============================================================

// ---------------------------------------------------------------------------
// Sliding window store
// Map<ip, timestamps[]>
// Each entry is a list of request timestamps within the current window.
// ---------------------------------------------------------------------------

const store = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 60 second window
const MAX_REQUESTS = 10; // max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get or initialise timestamps for this IP
  const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    // Update store with cleaned timestamps (don't add new one)
    store.set(ip, timestamps);
    return true;
  }

  // Allow request — record timestamp
  timestamps.push(now);
  store.set(ip, timestamps);
  return false;
}

// Prevent unbounded memory growth — prune IPs with no recent activity
function pruneStore() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    if (timestamps.every((t) => t < cutoff)) {
      store.delete(ip);
    }
  }
}

let pruneTimer = 0;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only rate-limit the AI query endpoint — everything else passes through
  if (pathname !== "/api/ai/query") {
    return NextResponse.next();
  }

  // Prune store every ~5 minutes to prevent memory leak
  const now = Date.now();
  if (now - pruneTimer > 5 * 60_000) {
    pruneStore();
    pruneTimer = now;
  }

  // Get real IP — Vercel sets x-forwarded-for
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "AI query limit reached. Try again in a minute.",
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Window": "60s",
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on API routes — skip static assets, _next internals
  matcher: ["/api/:path*"],
};
