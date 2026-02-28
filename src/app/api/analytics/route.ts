// src/app/api/analytics/route.ts
// Analytics data endpoint — powers the Analytics modal in the sidebar.
//
// Returns two datasets:
//   signal:   Task-focused metrics (open, done rate, by intent, by platform)
//   pipeline: AI pipeline metrics (messages in, noise rate, merge rate, arrivals)

import db from "@/lib/db";
import { NextResponse } from "next/server";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfToday(): Date {
  return startOfDay(new Date());
}

export async function GET() {
  try {
    const today = startOfToday();
    const sevenDaysAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    // ── PARALLEL QUERIES ─────────────────────────────────────
    const [
      // Signal tab
      allActiveTasks,
      resolvedToday,
      resolvedThisWeek,
      tasksByPriority,
      needsReviewCount,
      bookmarkedCount,
      // Daily arrivals (last 7 days) — raw tasks created per day
      recentTasks,
      // Pipeline tab
      totalEvents,
      recentEvents,
      totalTasksEver,
    ] = await Promise.all([
      // Active tasks (not done/trashed)
      db.nodalTask.findMany({
        where: { status: { notIn: ["DONE", "TRASHED"] } },
        select: {
          id: true,
          priority: true,
          intent: true,
          confidence: true,
          createdAt: true,
          sourceLinks: {
            select: {
              event: { select: { platform: true } },
            },
            where: { dismissed: false },
          },
        },
      }),
      // Resolved today
      db.nodalTask.count({
        where: { status: "DONE", updatedAt: { gte: today } },
      }),
      // Resolved this week
      db.nodalTask.count({
        where: { status: "DONE", updatedAt: { gte: sevenDaysAgo } },
      }),
      // Tasks by priority (active only)
      db.nodalTask.groupBy({
        by: ["priority"],
        where: { status: { notIn: ["DONE", "TRASHED"] } },
        _count: true,
      }),
      // Needs review
      db.nodalTask.count({
        where: { needsReview: true, status: { notIn: ["DONE", "TRASHED"] } },
      }),
      // Bookmarked
      db.nodalTask.count({ where: { bookmarked: true } }),
      // Tasks created last 30 days (for daily chart)
      db.nodalTask.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      // Total source events ever (messages received)
      db.sourceEvent.count(),
      // Source events last 7 days + platform breakdown
      db.sourceEvent.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { platform: true, createdAt: true },
      }),
      // Total tasks ever created
      db.nodalTask.count(),
    ]);

    // ── SIGNAL TAB COMPUTATION ────────────────────────────────

    // Intent distribution
    const intentCounts: Record<string, number> = {};
    for (const t of allActiveTasks) {
      const intent = t.intent ?? "unknown";
      intentCounts[intent] = (intentCounts[intent] ?? 0) + 1;
    }
    const topIntents = Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([intent, count]) => ({ intent, count }));

    // Platform distribution (from active tasks)
    const platformCounts: Record<string, number> = {};
    for (const t of allActiveTasks) {
      const seen = new Set<string>();
      for (const link of t.sourceLinks) {
        const p = link.event.platform;
        if (!seen.has(p)) {
          seen.add(p);
          platformCounts[p] = (platformCounts[p] ?? 0) + 1;
        }
      }
    }

    // Avg confidence of active tasks
    const avgConfidence =
      allActiveTasks.length > 0
        ? Math.round(
            (allActiveTasks.reduce((s, t) => s + t.confidence, 0) /
              allActiveTasks.length) *
              100,
          )
        : 0;

    // Priority breakdown
    const priorityMap: Record<string, number> = {};
    for (const row of tasksByPriority) {
      priorityMap[row.priority] = row._count;
    }

    // Daily arrivals last 14 days
    const dailyArrivals: { date: string; created: number; resolved: number }[] =
      [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgo(i);
      const nextD = daysAgo(i - 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const created = recentTasks.filter(
        (t) => t.createdAt >= d && t.createdAt < nextD,
      ).length;
      const resolved = recentTasks.filter(
        (t) => t.status === "DONE" && t.createdAt >= d && t.createdAt < nextD,
      ).length;
      dailyArrivals.push({ date: label, created, resolved });
    }

    // ── PIPELINE TAB COMPUTATION ──────────────────────────────

    // Noise filtered = events that didn't become tasks (approximation)
    const noiseFiltered = Math.max(0, totalEvents - totalTasksEver);
    const noiseFilterRate =
      totalEvents > 0 ? Math.round((noiseFiltered / totalEvents) * 100) : 0;

    // Merge rate = tasks that aggregated multiple messages
    // Proxy: tasks where seenEventCount > 1 or tasks with >1 source links
    const mergedTasks = await db.nodalTask.count({
      where: { seenEventCount: { gt: 1 } },
    });
    const mergeRate =
      totalTasksEver > 0 ? Math.round((mergedTasks / totalTasksEver) * 100) : 0;

    // Platform breakdown from recent events
    const pipelinePlatformCounts: Record<string, number> = {};
    for (const e of recentEvents) {
      pipelinePlatformCounts[e.platform] =
        (pipelinePlatformCounts[e.platform] ?? 0) + 1;
    }

    // Daily message arrivals (last 7 days) for pipeline
    const dailyMessages: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      const nextD = daysAgo(i - 1);
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const count = recentEvents.filter(
        (e) => e.createdAt >= d && e.createdAt < nextD,
      ).length;
      dailyMessages.push({ date: label, count });
    }

    const avgDailyMessages =
      dailyMessages.length > 0
        ? Math.round(
            dailyMessages.reduce((s, d) => s + d.count, 0) /
              dailyMessages.length,
          )
        : 0;

    return NextResponse.json({
      signal: {
        totalOpen: allActiveTasks.length,
        resolvedToday,
        resolvedThisWeek,
        needsReviewCount,
        bookmarkedCount,
        avgConfidence,
        priorityMap,
        topIntents,
        platformCounts,
        dailyArrivals,
      },
      pipeline: {
        totalEventsAllTime: totalEvents,
        eventsLast7Days: recentEvents.length,
        noiseFiltered,
        noiseFilterRate,
        totalTasksEver,
        mergedTasks,
        mergeRate,
        pipelinePlatformCounts,
        dailyMessages,
        avgDailyMessages,
      },
    });
  } catch (err) {
    console.error("[Analytics] Failed:", err);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
