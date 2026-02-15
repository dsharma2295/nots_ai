import { AutoRefresh } from "@/components/signal/auto-refresh";
import { SignalStream } from "@/components/signal/signal-stream";
import db from "@/lib/db";
import type { NodalTask } from "@/lib/mock-data";

export const revalidate = 10;

async function getTasks(): Promise<NodalTask[]> {
  const tasks = await db.nodalTask.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      sourceLinks: {
        where: { dismissed: false },
        include: {
          event: {
            include: {
              attachments: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
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
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
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
  const tasks = await getTasks();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <span className="text-sm font-black text-white">N</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-base font-semibold text-white">Nots</h1>
              <span className="text-base text-zinc-500">.ai</span>
            </div>
          </div>
          <AutoRefresh intervalSeconds={15} />
        </div>

        <SignalStream tasks={tasks} />

        {tasks.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-zinc-600"
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
            <p className="mt-1 text-xs text-zinc-600">
              Send a message in Slack or an email to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
