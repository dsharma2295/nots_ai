import { AppSidebar } from "@/components/app-sidebar";
import { AutoRefresh } from "@/components/auto-refresh";
import { BookmarksDrawers } from "@/components/bookmarks-drawers";
import { BookmarkedStream } from "@/features/bookmarks/bookmarked-stream";
import db from "@/lib/db";
import type { NodalTask } from "@/types";

export const dynamic = "force-dynamic";

const INCLUDE = {
  sourceLinks: {
    where: { dismissed: false },
    include: { event: { include: { attachments: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  _count: { select: { notes: true } },
} as const;

async function getBookmarkedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { bookmarked: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: INCLUDE,
  });
  return tasks.map(mapTaskRaw);
}

// Shared mapping helper — avoids duplicating the map() logic
function mapTaskRaw(t: {
  id: string;
  title: string;
  intent: string | null;
  priority: string;
  status: string;
  confidence: number;
  needsReview: boolean;
  tier: number;
  bookmarked: boolean;
  seenEventCount: number;
  hasBeenOpened: boolean;
  createdAt: Date;
  updatedAt: Date;
  trashedAt: Date | null;
  _count: { notes: number };
  sourceLinks: Array<{
    event: {
      id: string;
      platform: string;
      rawContent: string;
      deepLink: string;
      sender: string | null;
      timestamp: Date;
      attachments: Array<{
        name: string;
        url: string;
        mimeType: string | null;
      }>;
    };
  }>;
}): NodalTask {
  return {
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
  };
}

async function getResolvedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "DONE" },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: INCLUDE,
  });
  return tasks.map(mapTaskRaw);
}

async function getTrashedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "TRASHED" },
    orderBy: { trashedAt: "desc" },
    take: 50,
    include: INCLUDE,
  });
  return tasks.map(mapTaskRaw);
}

export default async function BookmarksPage() {
  const [tasks, resolvedTasks, trashedTasks] = await Promise.all([
    getBookmarkedTasks(),
    getResolvedTasks(),
    getTrashedTasks(),
  ]);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0a0a0f]">
      <AppSidebar activeView="bookmarks" />

      <main className="flex-1 pl-14">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          {/* Header — matches dashboard header style */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
                Bookmarks
              </span>
              <span className="text-[13px] text-zinc-400 dark:text-zinc-500">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </span>
            </div>
            <AutoRefresh intervalSeconds={15} />
          </div>

          <BookmarkedStream tasks={tasks} />
        </div>
      </main>

      {/* Drawers — listens for sidebar events, receives server-fetched data */}
      <BookmarksDrawers
        resolvedTasks={resolvedTasks}
        trashedTasks={trashedTasks}
      />
    </div>
  );
}
