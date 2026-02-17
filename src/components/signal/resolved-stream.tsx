"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Inbox,
  Paperclip,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

function LiveTime({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>{t}</>;
}

export function ResolvedStream({
  tasks: initialTasks,
}: {
  tasks: NodalTask[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRestore = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch("/api/tasks/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", taskId, status: "OPEN" }),
    });
  }, []);

  const handleBookmark = useCallback(async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, bookmarked: !t.bookmarked } : t,
      ),
    );
    await fetch("/api/tasks/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bookmark", taskId }),
    });
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800/40">
        <Inbox className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-800" />
        <p className="text-sm text-zinc-500 dark:text-zinc-600">
          No resolved tasks yet
        </p>
        <Link
          href="/"
          className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, i) => {
        const platforms = [
          ...new Set(task.sourceEvents.map((e) => e.platform)),
        ];
        const attachCount = task.sourceEvents.reduce(
          (a, e) => a + e.attachments.length,
          0,
        );
        const isExpanded = expandedId === task.id;

        return (
          <div
            key={task.id}
            className="group/card rounded-xl border border-zinc-200 bg-white opacity-60 transition-all duration-300 hover:opacity-100 dark:border-zinc-800/60 dark:bg-zinc-900/40"
            style={{
              animation:
                "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
              animationDelay: `${i * 40}ms`,
            }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setExpandedId(isExpanded ? null : task.id);
              }}
              className="w-full cursor-pointer px-4 py-3.5 text-left"
            >
              {/* Row 1: Done icon + title + actions */}
              <div className="mb-2 flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <h3 className="flex-1 text-[14px] font-medium leading-snug text-zinc-500 line-through dark:text-zinc-400">
                  {task.title}
                </h3>
                {/* Bookmark */}
                <button
                  title={task.bookmarked ? "Remove bookmark" : "Bookmark"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all group-hover/card:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmark(task.id);
                  }}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 transition-colors ${
                      task.bookmarked
                        ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                        : "text-zinc-400 hover:text-blue-400 dark:text-zinc-600 dark:hover:text-blue-400"
                    }`}
                  />
                </button>
                {/* Restore */}
                <button
                  title="Restore to dashboard"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(task.id);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Row 2: Meta */}
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1.5">
                  {platforms.map((p) => (
                    <PlatformDot
                      key={p}
                      platform={p as NodalTask["sourceEvents"][0]["platform"]}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
                  {task.sourceEvents.length} source
                  {task.sourceEvents.length !== 1 ? "s" : ""}
                </span>
                {attachCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                    <Paperclip className="h-3 w-3" />
                    {attachCount}
                  </span>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600">
                  <LiveTime iso={task.updatedAt} />
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-300 transition-transform duration-300 dark:text-zinc-700 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* Expand */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800/50">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                      Provenance
                    </span>
                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                  <SourceTimeline events={task.sourceEvents} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
