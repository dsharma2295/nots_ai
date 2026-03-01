import db from "@/lib/db";
import { NextResponse } from "next/server";

// =============================================================
// GET /api/health
//
// Returns 200 + JSON when all systems are operational.
// Returns 503 + JSON when any critical check fails.
//
// Checks:
//   - database: runs SELECT 1 against Neon
//   - environment: verifies required env vars exist
//
// Usage:
//   curl https://your-nots.vercel.app/api/health
// =============================================================

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GMAIL_TARGET_EMAIL",
];

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // ── Database check ──────────────────────────────────────────
  try {
    // Cheapest possible query — just verifies connection
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = `error: ${err instanceof Error ? err.message : "unknown"}`;
    healthy = false;
  }

  // ── Environment check ───────────────────────────────────────
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    checks.environment = `missing: ${missing.join(", ")}`;
    healthy = false;
  } else {
    checks.environment = "ok";
  }

  const body = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? `${Math.round(process.uptime())}s` : "unknown",
    checks,
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
