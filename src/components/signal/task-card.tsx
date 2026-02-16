"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Flag,
  Paperclip,
  Star,
} from "lucide-react";
import { useCallback, useState } from "react";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";

// =============================================================
// TIER CONFIG — 1: Gold, 2: Silver, 3: Bronze (default)
// =============================================================

const TIER_STYLE: Record<
  number,
  { border: string; glow: string; badge: string; label: string }
> = {
  1: {
    border: "border-amber-400/50 dark:border-amber-400/40",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.12)]",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
    label: "P1",
  },
  2: {
    border: "border-slate-300/50 dark:border-slate-400/30",
    glow: "shadow-[0_0_10px_rgba(148,163,184,0.10)]",
    badge: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
    label: "P2",
  },
  3: {
    border: "",
    glow: "",
    badge: "",
    label: "P3",
  },
};

// =============================================================
// COLUMN OPTIONS for explicit priority popup
// =============================================================

const COLUMN_OPTIONS = [
  {
    label: "Urgent",
    priority: "HIGH" as const,
    color:
      "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10",
  },
  {
    label: "Active",
    priority: "MEDIUM" as const,
    color:
      "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10",
  },
  {
    label: "Low Priority",
    priority: "LOW" as const,
    color:
      "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-500/10",
  },
];

const TIER_OPTIONS = [
  {
    tier: 1,
    label: "Gold",
    sublabel: "P1",
    badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
  },
  {
    tier: 2,
    label: "Silver",
    sublabel: "P2",
    badgeClass: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
  },
  {
    tier: 3,
    label: "Bronze",
    sublabel: "P3",
    badgeClass: "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100",
  },
];

// =============================================================
// HELPERS
// =============================================================

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

// =============================================================
// TASK CARD
// =============================================================

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
  const [fadingOut, setFadingOut] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTierMenu, setShowTierMenu] = useState(false);

  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);
  const sd = STATUS_DOT[task.status] ?? STATUS_DOT.OPEN;
  const sl = STATUS_LABEL[task.status] ?? "Open";
  const firstLink = task.sourceEvents[0]?.deepLink;

  const tierStyle = TIER_STYLE[task.tier] ?? TIER_STYLE[3];
  const hasTierVisual = task.tier === 1 || task.tier === 2;

  // ─── Mark Done with Fade ────────────────────────────────
  const handleMarkDone = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setFadingOut(true);
      // Wait for CSS transition
      await new Promise((r) => setTimeout(r, 450));
      onTaskActionExec?.(task.id, "done");
    },
    [task.id, onTaskActionExec],
  );

  // ─── Priority Change (explicit) ─────────────────────────
  const handlePriorityChange = useCallback(
    (priority: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPriorityMenu(false);
      onTaskActionExec?.(task.id, "priority", priority);
    },
    [task.id, onTaskActionExec],
  );

  // ─── Tier Change ────────────────────────────────────────
  const handleTierChange = useCallback(
    (tier: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowTierMenu(false);
      onTaskActionExec?.(task.id, "tier", String(tier));
    },
    [task.id, onTaskActionExec],
  );

  return (
    <div
      className={`group/card relative overflow-hidden rounded-xl transition-all duration-[450ms] ease-out
        border bg-white shadow-sm
        dark:bg-zinc-900/40
        ${fadingOut ? "opacity-0 scale-[0.97] translate-y-1 pointer-events-none" : "opacity-100 scale-100 hover:shadow-md dark:hover:bg-zinc-900/60 dark:hover:shadow-lg dark:hover:shadow-black/20"}
        ${hasTierVisual ? `${tierStyle.border} ${tierStyle.glow}` : "border-zinc-200 dark:border-zinc-800/60"}
        ${task.needsReview ? "ring-1 ring-amber-400/30" : ""}
        ${expanded ? "dark:bg-zinc-900/70 dark:ring-1 dark:ring-white/6" : ""}
      `}
      style={{
        animation: fadingOut
          ? "none"
          : "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
        animationDelay: fadingOut ? "0ms" : `${index * 50}ms`,
      }}
    >
      {/* Card body — clickable */}
      <button
        onClick={() => {
          if (!showPriorityMenu && !showTierMenu) setExpanded(!expanded);
        }}
        className="w-full cursor-pointer px-4 py-3.5 text-left"
      >
        {/* Row 1: Status + attachments + review + timestamp */}
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${sd}`} />
            {sl}
          </span>

          {hasTierVisual && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${tierStyle.badge}`}
            >
              {tierStyle.label}
            </span>
          )}

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

        {/* Row 2: Title */}
        <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 transition-colors duration-200 group-hover/card:text-zinc-700 dark:text-zinc-100 dark:group-hover/card:text-white">
          {task.title}
        </h3>

        {/* Row 3: Platform dots + sources + intent + hover actions */}
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

          {/* Spacer pushes actions/chevron to right */}
          <div className="ml-auto flex items-center">
            {/* Default: chevron (visible when NOT hovered) */}
            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-300 transition-all duration-300 dark:text-zinc-700 group-hover/card:hidden ${
                expanded ? "rotate-180" : ""
              }`}
            />

            {/* Hover: action buttons (visible when hovered) */}
            <div className="hidden items-center gap-0.5 group-hover/card:flex">
              {/* Mark done */}
              <button
                title="Mark done"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
                  text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600
                  dark:text-zinc-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                onClick={handleMarkDone}
              >
                <Check className="h-3.5 w-3.5" />
              </button>

              {/* Priority — explicit dropdown */}
              <div className="relative">
                <button
                  title="Move to column"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
                    text-zinc-400 hover:bg-orange-50 hover:text-orange-600
                    dark:text-zinc-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPriorityMenu(!showPriorityMenu);
                    setShowTierMenu(false);
                  }}
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>

                {showPriorityMenu && (
                  <div
                    className="absolute right-0 bottom-9 z-50 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      Move to
                    </div>
                    {COLUMN_OPTIONS.map((col) => (
                      <button
                        key={col.label}
                        onClick={(e) => handlePriorityChange(col.priority, e)}
                        className={`w-full px-3 py-2 text-left text-[12px] font-medium transition-colors ${col.color}`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tier — P1/P2/P3 */}
              <div className="relative">
                <button
                  title="Set emphasis tier"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
                    text-zinc-400 hover:bg-amber-50 hover:text-amber-600
                    dark:text-zinc-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTierMenu(!showTierMenu);
                    setShowPriorityMenu(false);
                  }}
                >
                  <Star className="h-3.5 w-3.5" />
                </button>

                {showTierMenu && (
                  <div
                    className="absolute right-0 bottom-9 z-50 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      Emphasis
                    </div>
                    {TIER_OPTIONS.map((opt) => (
                      <button
                        key={opt.tier}
                        onClick={(e) => handleTierChange(opt.tier, e)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/50"
                      >
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${opt.badgeClass}`}
                        >
                          {opt.sublabel}
                        </span>
                        {opt.label}
                        {task.tier === opt.tier && (
                          <Check className="ml-auto h-3 w-3 text-indigo-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Open original */}
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
          </div>
        </div>
      </button>

      {/* Expand/collapse timeline */}
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
