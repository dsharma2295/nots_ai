"use client";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { PlatformDot } from "@/components/platform-icon";
import { useToast } from "@/components/toast";
import {
  CreateNoteModal,
  NoteChips,
  ViewNoteModal,
} from "@/features/notes/note-modal";
import { SourceTimeline } from "@/features/timeline/source-timeline";
import { useLiveRelativeTime } from "@/hooks";
import { useNotes } from "@/hooks/use-notes";
import type { NodalTask } from "@/types";
import { AnimatePresence } from "framer-motion";
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
import { PortalDropdown } from "./portal-dropdown";
import {
  COLUMN_OPTIONS,
  DEFAULT_CARD,
  STATUS_DOT,
  STATUS_LABEL,
  TIER_OPTIONS,
  TIER_STYLE,
} from "./tier-config";

// =============================================================
// HELPERS
// =============================================================

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
  isNewArrival = false,
  isKeyboardFocused = false,
}: {
  task: NodalTask;
  index?: number;
  isNewArrival?: boolean;
  onTaskActionExec?: (
    taskId: string,
    action: string,
    value?: string,
  ) => Promise<void>;
  isKeyboardFocused?: boolean;
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
  const notes = useNotes(task.id, expanded, (id, count) => {
    onTaskActionExec?.(id, "noteCount", String(count));
  });
  const noteCount = notes.count(task.noteCount ?? 0);
  const tierStyle = task.tier > 0 ? TIER_STYLE[task.tier] : null;
  const cardClass = tierStyle ? tierStyle.card : DEFAULT_CARD;
  // State-based hover — persists while dropdowns are open or keyboard focused
  const handleMouseEnter = useCallback(() => setShowActions(true), []);
  const handleMouseLeave = useCallback(() => {
    if (!priorityOpen && !tierOpen && !isKeyboardFocused) {
      setShowActions(false);
    }
  }, [priorityOpen, tierOpen, isKeyboardFocused]);

  // Show actions when keyboard-focused (derived, not effect)
  const actionsVisible = showActions || isKeyboardFocused;

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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFadingOut(true);
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

  const handleDelete = useCallback(() => {
    setConfirmDelete(false);
    setFadingOut(true);
    onTaskActionExec?.(task.id, "delete");
  }, [task.id, onTaskActionExec, setConfirmDelete, setFadingOut]);
  const totalEvents = task.sourceEvents.length;
  const unseenCount = totalEvents - (task.seenEventCount ?? 0);
  const isNewTask =
    !task.hasBeenOpened && (task.seenEventCount ?? 0) === 0 && totalEvents > 0;
  const hasNewMessages = !isNewTask && unseenCount > 0;
  const showIndicator = isNewTask || hasNewMessages;

  // Keyboard nav: scroll focused card into view
  useEffect(() => {
    if (isKeyboardFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isKeyboardFocused]);

  // Keyboard nav: Enter to expand/collapse, N to open notes
  useEffect(() => {
    if (!isKeyboardFocused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const willExpand = !expanded;
        setExpanded(willExpand);
        if (willExpand && showIndicator) {
          onTaskActionExec?.(task.id, "markSeen", String(totalEvents));
        }
      }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        notes.setShowCreate(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    isKeyboardFocused,
    expanded,
    showIndicator,
    task.id,
    totalEvents,
    onTaskActionExec,
    notes,
  ]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group/card relative rounded-xl border shadow-sm transition-all duration-450 ease-out
        ${isNewArrival ? "animate-arrival" : ""}
        ${cardClass} ${fadingOut ? "pointer-events-none" : "hover:shadow-md hover:shadow-zinc-200/80 dark:hover:shadow-lg dark:hover:shadow-black/30"} ${task.needsReview ? "ring-1 ring-amber-400/30" : ""} ${isKeyboardFocused ? "ring-2 ring-indigo-500/50" : ""}`}
      style={{ willChange: "transform" }}
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
                  : "text-zinc-300 hover:text-blue-400 dark:text-zinc-500 dark:hover:text-blue-400"
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
                  : "text-zinc-300 hover:text-indigo-400 dark:text-zinc-500 dark:hover:text-indigo-400"
              }`}
            />
            {noteCount > 0 && (
              <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">
                {noteCount}
              </span>
            )}
          </button>
          {attachCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
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

        {/* Row 2: Title */}
        <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 transition-colors duration-200 dark:text-zinc-100">
          {task.title}
        </h3>
        {/* Row 3: platforms + sources + intent + (chevron OR actions) */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          {" "}
          <div className="flex shrink-0 -space-x-1.5">
            {" "}
            {platforms.map((p) => (
              <PlatformDot
                key={p}
                platform={p as NodalTask["sourceEvents"][0]["platform"]}
              />
            ))}
          </div>
          <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">
            {task.sourceEvents.length} message
            {task.sourceEvents.length !== 1 ? "s" : ""}
          </span>{" "}
          <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
            {task.intent}
          </span>{" "}
          <div className="ml-auto flex items-center">
            {!actionsVisible ? (
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-300 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:text-zinc-500 ${
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
                    dark:text-zinc-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  onClick={handleMarkDone}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  ref={priorityBtnRef}
                  title="Move to column"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all
                    text-zinc-400 hover:bg-orange-50 hover:text-orange-600 active:scale-90
                    dark:text-zinc-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
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
                    dark:text-zinc-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
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
                    dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
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
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
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
      {/*
        AnimatePresence wraps ViewNoteModal so the layoutId morph
        in note-modal.tsx works correctly on both open and close.
        Without this, the exit animation (chip shrink-back) won't fire.
      */}
      <AnimatePresence>
        {notes.viewing && (
          <ViewNoteModal
            note={notes.viewing}
            onClose={() => notes.setViewing(null)}
            onUpdate={notes.onUpdate}
            onDelete={notes.onDelete}
          />
        )}
      </AnimatePresence>
      {confirmDelete && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
