import { AutoRefresh } from "@/components/signal/auto-refresh";
import { SignalStream } from "@/components/signal/signal-stream";
import db from "@/lib/db";
import type { NodalTask } from "@/lib/mock-data";

// Revalidate every 10 seconds — dashboard auto-refreshes with new tasks
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
    <main className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end">
        <AutoRefresh intervalSeconds={15} />
      </div>
      <SignalStream tasks={tasks} />
      {tasks.length === 0 && (
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm text-zinc-400">
            No tasks yet. Send a message in Slack to get started.
          </p>
        </div>
      )}
    </main>
  );
}
