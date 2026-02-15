"use client";

import type { NodalTask } from "@/lib/mock-data";
import { useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

// =============================================================
// PRIORITY CONFIG
// =============================================================

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  HIGH: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    dot: "bg-orange-500",
  },
  MEDIUM: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  LOW: { bg: "bg-zinc-600/10", text: "text-zinc-500", dot: "bg-zinc-600" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "text-emerald-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400" },
  BLOCKED: { label: "Blocked", color: "text-red-400" },
  DONE: { label: "Done", color: "text-zinc-500" },
  ARCHIVED: { label: "Archived", color: "text-zinc-600" },
};

// =============================================================
// HELPERS
// =============================================================

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
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
  const priority = PRIORITY_STYLES[task.priority];
  const status = STATUS_CONFIG[task.status];
  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);

  return (
    <div
      className={`group overflow-hidden rounded-lg border transition-all duration-200 ${
        expanded
          ? "border-zinc-700 bg-zinc-900/80"
          : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/60"
      } ${task.needsReview ? "ring-1 ring-amber-500/20" : ""}`}
    >
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full cursor-pointer px-4 py-3 text-left"
      >
        {/* Row 1: Meta */}
        <div className="mb-1.5 flex items-center gap-2 text-[11px]">
          {/* Priority pill */}
          <span
            className={`rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider ${priority.bg} ${priority.text}`}
          >
            {task.priority}
          </span>

          {/* Status */}
          <span className={`${status.color}`}>{status.label}</span>

          {/* Attachment count */}
          {attachCount > 0 && (
            <span className="flex items-center gap-0.5 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M11.986 3.014a2.25 2.25 0 0 0-3.182 0L3.47 8.348a3.25 3.25 0 0 0 4.596 4.596l4.334-4.334a.75.75 0 1 1 1.06 1.06l-4.333 4.335a4.75 4.75 0 0 1-6.718-6.718l5.334-5.334a3.75 3.75 0 1 1 5.304 5.304l-4.9 4.9a2.25 2.25 0 0 1-3.182-3.182L9.3 4.64a.75.75 0 1 1 1.06 1.06l-4.334 4.335a.75.75 0 0 0 1.06 1.06l4.9-4.9a2.25 2.25 0 0 0 0-3.182Z"
                  clipRule="evenodd"
                />
              </svg>
              {attachCount}
            </span>
          )}

          {/* Timestamp */}
          <span className="ml-auto text-zinc-600">
            {timeAgo(task.updatedAt)}
          </span>
        </div>

        {/* Row 2: Title */}
        <h3 className="mb-2 text-[14px] font-medium leading-snug text-zinc-200">
          {task.needsReview && <span className="mr-1 text-amber-400">●</span>}
          {task.title}
        </h3>

        {/* Row 3: Bottom meta */}
        <div className="flex items-center gap-2.5 text-[11px]">
          {/* Platform dots */}
          <div className="flex items-center gap-1">
            {platforms.map((p) => (
              <PlatformDot
                key={p}
                platform={p as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>

          <span className="text-zinc-600">
            {task.sourceEvents.length} source
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>

          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
            {task.intent}
          </span>

          {/* Expand indicator */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`ml-auto h-3.5 w-3.5 text-zinc-700 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Expanded: Source Timeline */}
      {expanded && (
        <div className="border-t border-zinc-800/60 px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-zinc-800/60" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Source Timeline
            </span>
            <div className="h-px flex-1 bg-zinc-800/60" />
          </div>
          <SourceTimeline events={task.sourceEvents} />
        </div>
      )}
    </div>
  );
}
