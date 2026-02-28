// =============================================================
// src/app/api/settings/route.ts
// GET / POST user preferences (noise keywords, priority rules, etc.)
// Single-user setup: always uses GMAIL_TARGET_EMAIL user.
// =============================================================

import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PreferencesSchema = z.object({
  noiseKeywords: z.array(z.string().min(1).max(50)).max(100).default([]),
  urgentKeywords: z.array(z.string().min(1).max(50)).max(50).default([]),
  intentPriorityMap: z
    .record(z.string(), z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]))
    .default({}),
  autoRefreshInterval: z.number().int().min(10).max(300).default(15),
  ignoredPlatforms: z.array(z.string()).max(10).default([]),
  minMessageLength: z.number().int().min(1).max(200).default(3),
});

export type UserPreferences = z.infer<typeof PreferencesSchema>;

export const DEFAULT_PREFERENCES: UserPreferences = {
  noiseKeywords: [],
  urgentKeywords: ["urgent", "ASAP", "blocker", "outage", "down", "critical"],
  intentPriorityMap: {},
  autoRefreshInterval: 15,
  ignoredPlatforms: [],
  minMessageLength: 3,
};

async function getUser() {
  const email = process.env.GMAIL_TARGET_EMAIL ?? "user@nots.ai";
  const user = await db.user.findFirst({ where: { email } });
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
    }
    const raw = (user.preferences as Record<string, unknown>) ?? {};
    const parsed = PreferencesSchema.safeParse(raw);
    const preferences = parsed.success ? parsed.data : DEFAULT_PREFERENCES;
    return NextResponse.json({ preferences });
  } catch (err) {
    console.error("[Settings] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { preferences: parsed.data },
    });

    return NextResponse.json({ ok: true, preferences: parsed.data });
  } catch (err) {
    console.error("[Settings] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}

// GET pipeline stats for About section
export async function PUT() {
  try {
    const [totalTasks, totalEvents, trashedCount] = await Promise.all([
      db.nodalTask.count(),
      db.sourceEvent.count(),
      db.nodalTask.count({ where: { status: "TRASHED" } }),
    ]);

    const needsReview = await db.nodalTask.count({
      where: { needsReview: true, status: { notIn: ["DONE", "TRASHED"] } },
    });

    return NextResponse.json({
      totalTasks,
      totalEvents,
      trashedCount,
      needsReview,
      // Noise filtered = events - tasks (rough approximation)
      noiseFiltered: Math.max(0, totalEvents - totalTasks),
      noiseFilterRate:
        totalEvents > 0
          ? Math.round(((totalEvents - totalTasks) / totalEvents) * 100)
          : 0,
    });
  } catch (err) {
    console.error("[Settings] Stats failed:", err);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
