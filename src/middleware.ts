import { NextRequest, NextResponse } from "next/server";

// =============================================================
// Nots.ai — Edge Middleware
//
// 1. Auth gate — redirects unauthenticated users to /landing
// 2. Rate limiting on /api/ai/query (10 req / 60s per IP)
// =============================================================

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const PUBLIC_PATHS = [
  "/landing",
  "/login",
  "/api/auth/login",
  "/api/webhooks", // webhooks use HMAC, not session
  "/api/inngest", // Inngest uses its own signing key
];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    // static files (have an extension)
    /\.\w+$/.test(pathname)
  );
}

// ---------------------------------------------------------------------------
// Rate limiter — sliding window, in-memory
// ---------------------------------------------------------------------------

const store = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    store.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  store.set(ip, timestamps);
  return false;
}

function pruneStore() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of store.entries()) {
    if (timestamps.every((t) => t < cutoff)) store.delete(ip);
  }
}

let pruneTimer = 0;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Auth gate — skip for public paths
  if (!isPublic(pathname)) {
    const session = req.cookies.get("nots_session");
    if (!session) {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
  }

  // 2. Rate limit — only on AI query endpoint
  if (pathname === "/api/ai/query") {
    const now = Date.now();
    if (now - pruneTimer > 5 * 60_000) {
      pruneStore();
      pruneTimer = now;
    }

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
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets handled by Next.js internals
  matcher: ["/((?!_next/static|_next/image).*)"],
};
