import { ResolvedStream } from "@/components/signal/resolved-stream";
import { ThemeToggle } from "@/components/signal/theme-toggle";
import db from "@/lib/db";
import type { NodalTask } from "@/lib/mock-data";
import Link from "next/link";
export const dynamic = "force-dynamic";
async function getResolvedTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    where: { status: "DONE" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sourceLinks: {
        where: { dismissed: false },
        include: {
          event: {
            include: { attachments: true },
          },
        },
        orderBy: { createdAt: "asc" },
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
    noteCount: t._count.notes,
  }));
}

export default async function ResolvedPage() {
  const tasks = await getResolvedTasks();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 transition-colors duration-300 dark:bg-[#0a0a0f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[12px] text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-600 dark:hover:text-indigo-400"
            >
              ← Dashboard
            </Link>
            <div>
              <h1 className="text-base font-semibold text-zinc-900 dark:text-white">
                Resolved Tasks
              </h1>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-600">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} completed
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <ResolvedStream tasks={tasks} />
      </div>
    </main>
  );
}
