import { AutoRefresh } from "@/components/auto-refresh";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignalStream } from "@/features/dashboard/signal-stream";
import db from "@/lib/db";
import type { NodalTask } from "@/types";

export const dynamic = "force-dynamic";

async function getTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: { notIn: ["DONE", "TRASHED"] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      sourceLinks: {
        where: { dismissed: false },
        include: {
          event: { include: { attachments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { notes: true },
      },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    intent: t.intent ?? "unknown",
    priority: t.priority as NodalTask["priority"],
    status: t.status as NodalTask["status"],
    confidence: t.confidence,
    needsReview: t.needsReview,
    tier: t.tier,
    bookmarked: t.bookmarked,
    seenEventCount: t.seenEventCount,
    noteCount: t._count.notes,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    trashedAt: t.trashedAt?.toISOString() ?? null,
    hasBeenOpened: t.hasBeenOpened,
    sourceEvents: t.sourceLinks.map((link) => ({
      id: link.event.id,
      platform: link.event.platform as NodalTask["sourceEvents"][0]["platform"],
      rawContent: link.event.rawContent,
      deepLink: link.event.deepLink,
      sender: link.event.sender ?? "Unknown",
      timestamp: link.event.timestamp.toISOString(),
      attachments: link.event.attachments.map((a) => ({
        name: a.name,
        url: a.url,
        mimeType: a.mimeType ?? undefined,
      })),
    })),
  }));
}

async function getResolvedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "DONE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sourceLinks: {
        where: { dismissed: false },
        include: {
          event: { include: { attachments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { notes: true },
      },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    intent: t.intent ?? "unknown",
    priority: t.priority as NodalTask["priority"],
    status: t.status as NodalTask["status"],
    confidence: t.confidence,
    needsReview: t.needsReview,
    tier: t.tier,
    bookmarked: t.bookmarked,
    seenEventCount: t.seenEventCount,
    noteCount: t._count.notes,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    trashedAt: t.trashedAt?.toISOString() ?? null,
    hasBeenOpened: t.hasBeenOpened,
    sourceEvents: t.sourceLinks.map((link) => ({
      id: link.event.id,
      platform: link.event.platform as NodalTask["sourceEvents"][0]["platform"],
      rawContent: link.event.rawContent,
      deepLink: link.event.deepLink,
      sender: link.event.sender ?? "Unknown",
      timestamp: link.event.timestamp.toISOString(),
      attachments: link.event.attachments.map((a) => ({
        name: a.name,
        url: a.url,
        mimeType: a.mimeType ?? undefined,
      })),
    })),
  }));
}

async function getTrashedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "TRASHED" },
    orderBy: { trashedAt: "desc" },
    take: 50,
    include: {
      sourceLinks: {
        where: { dismissed: false },
        include: { event: { include: { attachments: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { notes: true } },
    },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    intent: t.intent ?? "unknown",
    priority: t.priority as NodalTask["priority"],
    status: t.status as NodalTask["status"],
    confidence: t.confidence,
    needsReview: t.needsReview,
    tier: t.tier,
    bookmarked: t.bookmarked,
    seenEventCount: t.seenEventCount,
    noteCount: t._count.notes,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    trashedAt: t.trashedAt?.toISOString() ?? null,
    hasBeenOpened: t.hasBeenOpened,
    sourceEvents: t.sourceLinks.map((link) => ({
      id: link.event.id,
      platform: link.event.platform as NodalTask["sourceEvents"][0]["platform"],
      rawContent: link.event.rawContent,
      deepLink: link.event.deepLink,
      sender: link.event.sender ?? "Unknown",
      timestamp: link.event.timestamp.toISOString(),
      attachments: link.event.attachments.map((a) => ({
        name: a.name,
        url: a.url,
        mimeType: a.mimeType ?? undefined,
      })),
    })),
  }));
}

export default async function Home() {
  const [tasks, resolvedTasks, trashedTasks] = await Promise.all([
    getTasks(),
    getResolvedTasks(),
    getTrashedTasks(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 transition-colors duration-300 dark:bg-[#0a0a0f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark — funnel: wide mouth narrows to a single drop */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Funnel body: trapezoid, wide at top narrowing down */}
                <path
                  d="M2 3h14L11 9.5H7L2 3Z"
                  className="fill-zinc-800 dark:fill-zinc-100"
                  opacity="0.18"
                />
                {/* Funnel neck: the narrowed channel */}
                <path
                  d="M7 9.5h4v2.5H7V9.5Z"
                  className="fill-zinc-800 dark:fill-zinc-100"
                  opacity="0.55"
                />
                {/* Single drop: the refined signal output */}
                <circle
                  cx="9"
                  cy="15"
                  r="1.5"
                  className="fill-zinc-800 dark:fill-zinc-100"
                />
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                Nots
              </h1>
              <span className="text-base tracking-tight text-zinc-400 dark:text-zinc-500">
                .ai
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AutoRefresh intervalSeconds={15} />
            <ThemeToggle />
          </div>
        </div>

        <SignalStream
          tasks={tasks}
          resolvedTasks={resolvedTasks}
          trashedTasks={trashedTasks}
        />
        {tasks.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-float items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-zinc-400 dark:text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">No tasks yet</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              Send a message in Slack or an email to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
