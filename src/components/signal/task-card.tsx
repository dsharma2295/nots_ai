"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import { ChevronDown, Paperclip } from "lucide-react";
import { useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

// =============================================================
// PRIORITY & STATUS CONFIG
// =============================================================

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  MEDIUM: "bg-zinc-500/10 text-zinc-400",
  LOW: "bg-zinc-600/10 text-zinc-500",
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

function uniquePlatforms(task: NodalTask): string[] {
  return [...new Set(task.sourceEvents.map((e) => e.platform))];
}

function totalAttachments(task: NodalTask): number {
  return task.sourceEvents.reduce((acc, e) => acc + e.attachments.length, 0);
}

// =============================================================
// TIME DISPLAY (uses live hook)
// =============================================================

function LiveTime({ iso }: { iso: string }) {
  const text = useLiveRelativeTime(iso);
  return <span>{text}</span>;
}

// =============================================================
// TASK CARD
// =============================================================

export function TaskCard({
  task,
  index = 0,
  draggable = false,
  onDragStartAction,
  onDragOverAction,
  onDropAction,
}: {
  task: NodalTask;
  index?: number;
  draggable?: boolean;
  onDragStartAction?: (e: React.DragEvent, idx: number) => void;
  onDragOverAction?: (e: React.DragEvent) => void;
  onDropAction?: (e: React.DragEvent, idx: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM;
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.OPEN;
  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStartAction?.(e, index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverAction?.(e);
      }}
      onDrop={(e) => onDropAction?.(e, index)}
      className={`group overflow-hidden rounded-lg border shadow-md shadow-black/20 transition-all duration-200 ease-in-out ${
        expanded
          ? "border-zinc-700 bg-zinc-900/60 ring-1 ring-white/5"
          : "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700/80 hover:bg-zinc-900/50"
      } ${task.needsReview ? "ring-1 ring-amber-500/20" : ""} ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      style={{
        animation: "cardEnter 0.4s ease-out backwards",
        animationDelay: `${index * 75}ms`,
      }}
    >
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full cursor-pointer px-4 py-3 text-left"
      >
        {/* Row 1: Meta */}
        <div className="mb-1.5 flex items-center gap-2 text-[10px]">
          <span
            className={`rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${priority}`}
          >
            {task.priority}
          </span>

          <span className={`font-medium ${status.color}`}>{status.label}</span>

          {attachCount > 0 && (
            <span className="flex items-center gap-0.5 text-zinc-500">
              <Paperclip className="h-3 w-3" />
              {attachCount}
            </span>
          )}

          <span className="ml-auto text-zinc-600">
            <LiveTime iso={task.updatedAt} />
          </span>
        </div>

        {/* Row 2: Title */}
        <h3 className="mb-2 text-[14px] font-medium leading-snug text-zinc-100 transition-colors duration-200 group-hover:text-indigo-400">
          {task.needsReview && (
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
          )}
          {task.title}
        </h3>

        {/* Row 3: Bottom meta */}
        <div className="flex items-center gap-2.5 text-[11px]">
          {/* Overlapping platform dots */}
          <div className="flex items-center -space-x-1">
            {platforms.map((p) => (
              <PlatformDot
                key={p}
                platform={p as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>

          <span className="text-zinc-500">
            {task.sourceEvents.length} source
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>

          <span className="rounded border border-zinc-700/50 bg-zinc-800/50 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {task.intent}
          </span>

          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Smooth expand/collapse via CSS grid-rows */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-zinc-800/50 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-zinc-800/60" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Source Timeline
              </span>
              <div className="h-px flex-1 bg-zinc-800/60" />
            </div>
            <SourceTimeline events={task.sourceEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
