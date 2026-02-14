"use client";

import { Badge } from "@/components/ui/badge";
import type { NodalTask } from "@/lib/mock-data";
import { useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

// =============================================================
// PRIORITY CONFIG
// =============================================================

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIUM: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  LOW: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500",
};

const STATUS_STYLES: Record<string, { label: string; dot: string }> = {
  OPEN: { label: "Open", dot: "bg-emerald-500" },
  IN_PROGRESS: { label: "In Progress", dot: "bg-blue-500" },
  BLOCKED: { label: "Blocked", dot: "bg-red-500" },
  DONE: { label: "Done", dot: "bg-zinc-400" },
  ARCHIVED: { label: "Archived", dot: "bg-zinc-300" },
};

// =============================================================
// HELPERS
// =============================================================

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function uniquePlatforms(task: NodalTask): string[] {
  return [...new Set(task.sourceEvents.map((e) => e.platform))];
}

function totalAttachments(task: NodalTask): number {
  return task.sourceEvents.reduce((acc, e) => acc + e.attachments.length, 0);
}

// =============================================================
// TASK CARD
// =============================================================

export function TaskCard({ task }: { task: NodalTask }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_STYLES[task.status];
  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);

  return (
    <div
      className={`group rounded-xl border transition-all ${
        task.needsReview
          ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      {/* Main card — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full cursor-pointer p-4 text-left"
      >
        {/* Top row: priority + status + attachments + time */}
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </Badge>

          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${status.dot}`}
            />
            {status.label}
          </span>

          {attachCount > 0 && (
            <span
              className="flex items-center gap-1 text-xs text-zinc-400"
              title={`${attachCount} attachment${attachCount !== 1 ? "s" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                  clipRule="evenodd"
                />
              </svg>
              {attachCount}
            </span>
          )}

          <span className="ml-auto text-xs text-zinc-400">
            {timeAgo(task.updatedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {task.needsReview && (
            <span className="mr-1.5 text-amber-500" title="Needs human review">
              ⚠
            </span>
          )}
          {task.title}
        </h3>

        {/* Bottom row: platform dots + event count + expand hint */}
        <div className="flex items-center gap-3">
          {/* Platform dots */}
          <div className="flex items-center gap-1">
            {platforms.map((p) => (
              <PlatformDot
                key={p}
                platform={p as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>

          {/* Event count */}
          <span className="text-xs text-zinc-400">
            {task.sourceEvents.length} source
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>

          {/* Intent tag */}
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {task.intent}
          </span>

          {/* Expand arrow */}
          <span
            className={`ml-auto text-zinc-300 transition-transform dark:text-zinc-600 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Expanded: Source Timeline */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Source Timeline
          </p>
          <SourceTimeline events={task.sourceEvents} />
        </div>
      )}
    </div>
  );
}
