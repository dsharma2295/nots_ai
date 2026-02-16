"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import {
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Flag,
  Paperclip,
} from "lucide-react";
import { useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-emerald-500",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-500",
  DONE: "bg-zinc-400 dark:bg-zinc-600",
  ARCHIVED: "bg-zinc-300 dark:bg-zinc-700",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Active",
  BLOCKED: "Blocked",
  DONE: "Done",
  ARCHIVED: "Archived",
};

function LiveTime({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>{t}</>;
}

function uniquePlatforms(task: NodalTask): string[] {
  return [...new Set(task.sourceEvents.map((e) => e.platform))];
}

function totalAttachments(task: NodalTask): number {
  return task.sourceEvents.reduce((a, e) => a + e.attachments.length, 0);
}

export function TaskCard({
  task,
  index = 0,
  onTaskActionExec,
}: {
  task: NodalTask;
  index?: number;
  onTaskActionExec?: (
    taskId: string,
    action: string,
    value?: string,
  ) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);
  const sd = STATUS_DOT[task.status] ?? STATUS_DOT.OPEN;
  const sl = STATUS_LABEL[task.status] ?? "Open";

  // First source deepLink for quick-open
  const firstLink = task.sourceEvents[0]?.deepLink;

  return (
    <div
      className={`group/card relative overflow-hidden rounded-xl transition-all duration-300 ease-out
        border border-zinc-200 bg-white shadow-sm hover:shadow-md
        dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60 dark:hover:shadow-lg dark:hover:shadow-black/20
        ${task.needsReview ? "ring-1 ring-amber-400/30" : ""}
        ${expanded ? "dark:bg-zinc-900/70 dark:ring-1 dark:ring-white/6" : ""}
      `}
      style={{
        animation: "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Hover action buttons — appear on right edge */}
      <div className="absolute right-2 top-3 z-10 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
        <button
          title="Mark done"
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
            text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600
            dark:text-zinc-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
          onClick={(e) => {
            e.stopPropagation();
            onTaskActionExec?.(task.id, "done");
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          title="Change priority"
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
            text-zinc-400 hover:bg-orange-50 hover:text-orange-600
            dark:text-zinc-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
          onClick={(e) => {
            e.stopPropagation();
            const next: Record<string, string> = {
              LOW: "MEDIUM",
              MEDIUM: "HIGH",
              HIGH: "CRITICAL",
              CRITICAL: "LOW",
            };
            onTaskActionExec?.(
              task.id,
              "priority",
              next[task.priority] ?? "MEDIUM",
            );
          }}
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
        <button
          title="Snooze"
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
            text-zinc-400 hover:bg-blue-50 hover:text-blue-600
            dark:text-zinc-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
          onClick={(e) => {
            e.stopPropagation();
            onTaskActionExec?.(task.id, "snooze");
          }}
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
        {firstLink && (
          <a
            href={firstLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Open source"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
              text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600
              dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Card body */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full cursor-pointer px-4 py-3.5 text-left"
      >
        {/* Meta row */}
        <div className="mb-2 flex items-center gap-2 pr-24">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${sd}`} />
            {sl}
          </span>

          {attachCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">
              <Paperclip className="h-3 w-3" />
              {attachCount}
            </span>
          )}

          {task.needsReview && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Review
            </span>
          )}

          <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600">
            <LiveTime iso={task.updatedAt} />
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2.5 pr-24 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 transition-colors duration-200 group-hover/card:text-zinc-700 dark:text-zinc-100 dark:group-hover/card:text-white">
          {task.title}
        </h3>

        {/* Bottom meta */}
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-1.5">
            {platforms.map((p) => (
              <PlatformDot
                key={p}
                platform={p as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>

          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {task.sourceEvents.length} source
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>

          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
            {task.intent}
          </span>

          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 text-zinc-300 transition-transform duration-300 dark:text-zinc-700 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expand/collapse */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
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
}
