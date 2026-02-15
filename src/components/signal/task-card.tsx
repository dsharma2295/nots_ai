"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import { AlertCircle, ChevronDown, Paperclip } from "lucide-react";
import { useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

const PRIORITY: Record<
  string,
  { label: string; class: string; border: string }
> = {
  CRITICAL: {
    label: "P0",
    class: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
    border: "border-l-red-500/60",
  },
  HIGH: {
    label: "P1",
    class: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25",
    border: "border-l-orange-500/60",
  },
  MEDIUM: {
    label: "P2",
    class: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
    border: "border-l-zinc-700/60",
  },
  LOW: {
    label: "P3",
    class: "bg-zinc-800/50 text-zinc-500 ring-1 ring-zinc-700/30",
    border: "border-l-zinc-800/60",
  },
};

const STATUS: Record<string, { label: string; dot: string }> = {
  OPEN: { label: "Open", dot: "bg-emerald-500" },
  IN_PROGRESS: { label: "Active", dot: "bg-blue-500" },
  BLOCKED: { label: "Blocked", dot: "bg-red-500" },
  DONE: { label: "Done", dot: "bg-zinc-500" },
  ARCHIVED: { label: "Archived", dot: "bg-zinc-700" },
};

function LiveTime({ iso }: { iso: string }) {
  const text = useLiveRelativeTime(iso);
  return <>{text}</>;
}

function uniquePlatforms(task: NodalTask): string[] {
  return [...new Set(task.sourceEvents.map((e) => e.platform))];
}

function totalAttachments(task: NodalTask): number {
  return task.sourceEvents.reduce((acc, e) => acc + e.attachments.length, 0);
}

export function TaskCard({
  task,
  index = 0,
}: {
  task: NodalTask;
  index?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = PRIORITY[task.priority] ?? PRIORITY.MEDIUM;
  const s = STATUS[task.status] ?? STATUS.OPEN;
  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-l-2 transition-all duration-300 ease-out ${p.border} ${
        expanded
          ? "bg-zinc-900/80 ring-1 ring-white/[0.06] shadow-xl shadow-black/30"
          : "bg-zinc-900/40 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-black/20"
      } ${task.needsReview ? "ring-1 ring-amber-500/15" : ""}`}
      style={{
        animation: "cardSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) backwards",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Hover glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(600px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),_rgba(99,102,241,0.04),_transparent_40%)]" />

      <button
        onClick={() => setExpanded(!expanded)}
        className="relative w-full cursor-pointer px-4 py-3.5 text-left"
      >
        {/* Row 1 */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${p.class}`}
          >
            {p.label}
          </span>

          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>

          {attachCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-600">
              <Paperclip className="h-3 w-3" />
              {attachCount}
            </span>
          )}

          {task.needsReview && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/20">
              <AlertCircle className="h-2.5 w-2.5" />
              Review
            </span>
          )}

          <span className="ml-auto text-[11px] tabular-nums text-zinc-600">
            <LiveTime iso={task.updatedAt} />
          </span>
        </div>

        {/* Row 2: Title */}
        <h3 className="mb-2.5 text-[15px] font-medium leading-snug tracking-tight text-zinc-100 transition-colors duration-200 group-hover:text-white">
          {task.title}
        </h3>

        {/* Row 3: Meta */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {platforms.map((pl) => (
              <PlatformDot
                key={pl}
                platform={pl as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>

          <span className="text-[11px] text-zinc-500">
            {task.sourceEvents.length} source
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>

          <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-500 ring-1 ring-zinc-700/40">
            {task.intent}
          </span>

          <ChevronDown
            className={`ml-auto h-4 w-4 text-zinc-700 transition-transform duration-300 ease-out group-hover:text-zinc-500 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expandable timeline — CSS grid animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                Provenance
              </span>
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
            </div>
            <SourceTimeline events={task.sourceEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
