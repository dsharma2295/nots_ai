import { AppSidebar } from "@/components/app-sidebar";
import { AutoRefresh } from "@/components/auto-refresh";
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

async function getResolvedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "DONE" },
    orderBy: { createdAt: "desc" },
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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0a0a0f]">
      {/* Fixed 56px left rail — logo, nav, settings */}
      <AppSidebar activeView="dashboard" />

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 pl-14">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {/* Compact top bar — product name + live pill only */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
                Nots
              </span>
              <span className="text-[15px] text-zinc-400 dark:text-zinc-500">
                .ai
              </span>
            </div>
            <AutoRefresh intervalSeconds={15} />
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
    </div>
  );
}
