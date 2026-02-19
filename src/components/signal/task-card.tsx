"use client";
import { useLiveRelativeTime } from "@/lib/hooks";
import { useNotes } from "@/lib/hooks/use-notes";
import type { NodalTask } from "@/lib/mock-data";
import {
  ArrowRightLeft,
  Bookmark,
  Check,
  ChevronDown,
  Medal,
  NotebookPen,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { CreateNoteModal, NoteChips, ViewNoteModal } from "./note-modal";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";
import { useToast } from "./toast";
// =============================================================
// TIER CONFIG — full card sheen
// 1: Gold, 2: Silver, 3: Bronze
// =============================================================

const TIER_STYLE: Record<
  number,
  { card: string; badge: string; label: string }
> = {
  1: {
    card: "border-amber-400/50 bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white dark:border-amber-400/30 dark:from-amber-500/[0.08] dark:via-yellow-500/[0.04] dark:to-zinc-900/40",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm",
    label: "P1",
  },
  2: {
    card: "border-slate-300/60 bg-gradient-to-br from-slate-100/80 via-slate-50/40 to-white dark:border-slate-400/25 dark:from-slate-400/[0.07] dark:via-slate-300/[0.03] dark:to-zinc-900/40",
    badge:
      "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800 shadow-sm",
    label: "P2",
  },
  3: {
    card: "border-amber-700/30 bg-gradient-to-br from-orange-50/60 via-amber-50/30 to-white dark:border-amber-700/20 dark:from-amber-800/[0.06] dark:via-orange-900/[0.03] dark:to-zinc-900/40",
    badge:
      "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100 shadow-sm",
    label: "P3",
  },
};

const DEFAULT_CARD =
  "border-zinc-200 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/40";

// =============================================================
// COLUMN / TIER OPTIONS
// =============================================================

const COLUMN_OPTIONS = [
  {
    label: "Urgent",
    priority: "HIGH" as const,
    color:
      "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10",
  },
  {
    label: "Normal",
    priority: "MEDIUM" as const,
    color:
      "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10",
  },
  {
    label: "Low Priority",
    priority: "LOW" as const,
    color:
      "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10",
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
// PORTAL DROPDOWN — renders at document.body, never clipped
// =============================================================

function PortalDropdown({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow > 200 || spaceBelow > spaceAbove) {
      setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    } else {
      setPos({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.right - 160,
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={dropRef}
      className="fixed z-[9999] w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
      style={{
        top: pos.top,
        bottom: pos.bottom,
        left: Math.max(8, pos.left),
      }}
    >
      {children}
    </div>,
    document.body,
  );
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
  const [showActions, setShowActions] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const priorityBtnRef = useRef<HTMLButtonElement>(null);
  const tierBtnRef = useRef<HTMLButtonElement>(null);

  const platforms = uniquePlatforms(task);
  const attachCount = totalAttachments(task);
  const sd = STATUS_DOT[task.status] ?? STATUS_DOT.OPEN;
  const sl = STATUS_LABEL[task.status] ?? "Open";

  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notes = useNotes(task.id, expanded);
  const noteCount = notes.count(task.noteCount ?? 0);
  const tierStyle = task.tier > 0 ? TIER_STYLE[task.tier] : null;
  const cardClass = tierStyle ? tierStyle.card : DEFAULT_CARD;
  // State-based hover — persists while dropdowns are open
  const handleMouseEnter = useCallback(() => setShowActions(true), []);
  const handleMouseLeave = useCallback(() => {
    if (!priorityOpen && !tierOpen) {
      setShowActions(false);
    }
  }, [priorityOpen, tierOpen]);

  const closePriority = useCallback(() => {
    setPriorityOpen(false);
    setTimeout(() => {
      if (cardRef.current && !cardRef.current.matches(":hover")) {
        setShowActions(false);
      }
    }, 50);
  }, []);

  const closeTier = useCallback(() => {
    setTierOpen(false);
    setTimeout(() => {
      if (cardRef.current && !cardRef.current.matches(":hover")) {
        setShowActions(false);
      }
    }, 50);
  }, []);

  const handleMarkDone = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setFadingOut(true);
      await new Promise((r) => setTimeout(r, 450));
      onTaskActionExec?.(task.id, "done");
    },
    [task.id, onTaskActionExec],
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      closePriority();
      onTaskActionExec?.(task.id, "priority", priority);
    },
    [task.id, onTaskActionExec, closePriority],
  );

  const handleTierChange = useCallback(
    (tier: number) => {
      closeTier();
      onTaskActionExec?.(task.id, "tier", String(tier));
    },
    [task.id, onTaskActionExec, closeTier],
  );
  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTaskActionExec?.(task.id, "bookmark");
    },
    [task.id, onTaskActionExec],
  );

  const handleDelete = useCallback(async () => {
    setConfirmDelete(false);
    setFadingOut(true);
    await new Promise((r) => setTimeout(r, 300));
    onTaskActionExec?.(task.id, "delete");
  }, [task.id, onTaskActionExec, setConfirmDelete, setFadingOut]);
  const totalEvents = task.sourceEvents.length;
  const unseenCount = totalEvents - (task.seenEventCount ?? 0);
  const isNewTask = (task.seenEventCount ?? 0) === 0 && totalEvents > 0;
  const hasNewMessages = !isNewTask && unseenCount > 0;
  const showIndicator = isNewTask || hasNewMessages;
  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group/card relative rounded-xl border shadow-sm transition-all duration-450 ease-out
        ${cardClass}
${fadingOut ? "pointer-events-none scale-[0.97] opacity-0" : "scale-100 opacity-100 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20"}
        ${task.needsReview ? "ring-1 ring-amber-400/30" : ""}      `}
      style={{
        animation: fadingOut
          ? "none"
          : "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
        animationDelay: fadingOut ? "0ms" : `${index * 50}ms`,
      }}
    >
      {/* ─── PORTAL DROPDOWNS ─── */}
      <PortalDropdown
        anchorRef={priorityBtnRef}
        open={priorityOpen}
        onClose={closePriority}
      >
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Move to
        </div>
        {COLUMN_OPTIONS.map((col) => (
          <button
            key={col.label}
            onClick={() => handlePriorityChange(col.priority)}
            className={`w-full px-3 py-2 text-left text-[12px] font-medium transition-colors ${col.color}`}
          >
            {col.label}
          </button>
        ))}
      </PortalDropdown>
      <PortalDropdown
        anchorRef={tierBtnRef}
        open={tierOpen}
        onClose={closeTier}
      >
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Emphasis
        </div>
        {TIER_OPTIONS.map((opt) => (
          <button
            key={opt.tier}
            onClick={() => handleTierChange(opt.tier)}
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
        {task.tier > 0 && (
          <>
            <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-700" />
            <button
              onClick={() => handleTierChange(0)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-zinc-400 transition-colors hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-700/50"
            >
              Clear
            </button>
          </>
        )}
      </PortalDropdown>
      {/* ─── CARD BODY (clickable for expand) ─── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (priorityOpen || tierOpen) return;
          const willExpand = !expanded;
          setExpanded(willExpand);
          if (willExpand && showIndicator) {
            onTaskActionExec?.(task.id, "markSeen", String(totalEvents));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            const willExpand = !expanded;
            setExpanded(willExpand);
            if (willExpand && showIndicator) {
              onTaskActionExec?.(task.id, "markSeen", String(totalEvents));
            }
          }
        }}
        className="w-full cursor-pointer px-4 py-3.5 text-left"
      >
        {/* Row 1: status + tier badge + attachments + review + time */}
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${sd}`} />
            {sl}
          </span>
          {tierStyle && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${tierStyle.badge}`}
            >
              {tierStyle.label}
            </span>
          )}
          <button
            title={task.bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={handleBookmark}
            className="flex items-center transition-transform active:scale-90"
          >
            <Bookmark
              className={`h-3 w-3 transition-colors ${
                task.bookmarked
                  ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                  : "text-zinc-300 hover:text-blue-400 dark:text-zinc-700 dark:hover:text-blue-400"
              }`}
            />
          </button>
          <button
            title={
              noteCount > 0
                ? `${noteCount} note${noteCount !== 1 ? "s" : ""}`
                : "Add note"
            }
            onClick={(e) => {
              e.stopPropagation();
              notes.setShowCreate(true);
            }}
            className="flex items-center gap-1 transition-transform active:scale-90"
          >
            <NotebookPen
              className={`h-3 w-3 transition-colors ${
                noteCount > 0
                  ? "text-indigo-500 dark:text-indigo-400"
                  : "text-zinc-300 hover:text-indigo-400 dark:text-zinc-700 dark:hover:text-indigo-400"
              }`}
            />
            {noteCount > 0 && (
              <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">
                {noteCount}
              </span>
            )}
          </button>
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
          {showIndicator && (
            <span className="ml-auto">
              {isNewTask ? (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              ) : (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_6px_rgba(244,63,94,0.5)]">
                  {" "}
                  {unseenCount}
                </span>
              )}
            </span>
          )}{" "}
        </div>

        {/* Row 2: Title + unread indicator */}
        <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 transition-colors duration-200 dark:text-zinc-100">
          {task.title}
        </h3>
        {/* Row 3: platforms + sources + intent + (chevron OR actions) */}
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

          <div className="ml-auto flex items-center">
            {!showActions ? (
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-300 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:text-zinc-700 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            ) : (
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  title="Mark done"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all
                    text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 active:scale-90
                    dark:text-zinc-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  onClick={handleMarkDone}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  ref={priorityBtnRef}
                  title="Move to column"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all
                    text-zinc-400 hover:bg-orange-50 hover:text-orange-600 active:scale-90
                    dark:text-zinc-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
                  onClick={() => {
                    setPriorityOpen(!priorityOpen);
                    setTierOpen(false);
                  }}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  ref={tierBtnRef}
                  title="Set emphasis tier"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all
                    text-zinc-400 hover:bg-amber-50 hover:text-amber-600 active:scale-90
                    dark:text-zinc-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                  onClick={() => {
                    setTierOpen(!tierOpen);
                    setPriorityOpen(false);
                  }}
                >
                  <Medal className="h-3.5 w-3.5" />{" "}
                </button>
                <button
                  title="Delete task"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all
                    text-zinc-400 hover:bg-red-50 hover:text-red-500 active:scale-90
                    dark:text-zinc-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ─── EXPANDABLE TIMELINE (outside the clickable div) ─── */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          {notes.loaded && notes.list.length > 0 && (
            <div className="border-t border-zinc-100 px-4 pb-0 pt-3 dark:border-zinc-800/50">
              <NoteChips
                notes={notes.list}
                onClickNote={(note) => notes.setViewing(note)}
              />
            </div>
          )}
          <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800/50">
            <div className="mb-3 flex items-center gap-3">
              {" "}
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
      {notes.showCreate && (
        <CreateNoteModal
          taskId={task.id}
          sourceEvents={task.sourceEvents}
          onClose={() => notes.setShowCreate(false)}
          onCreate={notes.onCreate}
        />
      )}
      {notes.viewing && (
        <ViewNoteModal
          note={notes.viewing}
          onClose={() => notes.setViewing(null)}
          onUpdate={notes.onUpdate}
          onDelete={notes.onDelete}
        />
      )}{" "}
      {confirmDelete && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
