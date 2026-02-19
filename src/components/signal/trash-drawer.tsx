"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import {
  ChevronDown,
  Inbox,
  Paperclip,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";
import { useToast } from "./toast";

function LiveTime({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>{t}</>;
}

function TrashedAgo({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>Trashed {t}</>;
}

// =============================================================
// TRASHED CARD
// =============================================================

function TrashedCard({
  task,
  index,
  onRestore,
  onPermanentDelete,
}: {
  task: NodalTask;
  index: number;
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const platforms = [...new Set(task.sourceEvents.map((e) => e.platform))];
  const attachCount = task.sourceEvents.reduce(
    (a, e) => a + e.attachments.length,
    0,
  );

  return (
    <>
      <div
        className="group/card rounded-xl border border-red-200/40 bg-white opacity-40 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-70 dark:border-red-900/20 dark:bg-zinc-900/40"
        style={{
          animation: "drawerCardIn 0.35s cubic-bezier(0.16,1,0.3,1) backwards",
          animationDelay: `${index * 40}ms`,
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpanded(!expanded);
          }}
          className="w-full cursor-pointer px-4 py-3.5 text-left"
        >
          {/* Row 1: trash icon + title + restore + permanent delete */}
          <div className="mb-2 flex items-start gap-2">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-400 dark:text-red-500/60" />
            <h3 className="flex-1 text-[13px] font-medium leading-snug text-zinc-400 line-through dark:text-zinc-500">
              {task.title}
            </h3>
            {/* Restore */}
            <button
              title="Restore to dashboard"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(task.id);
              }}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            {/* Permanent delete */}
            <button
              title="Delete permanently"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Row 2: meta */}
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {platforms.map((p) => (
                <PlatformDot
                  key={p}
                  platform={p as NodalTask["sourceEvents"][0]["platform"]}
                />
              ))}
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
              {task.sourceEvents.length} source
              {task.sourceEvents.length !== 1 ? "s" : ""}
            </span>
            {attachCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-600">
                <Paperclip className="h-2.5 w-2.5" />
                {attachCount}
              </span>
            )}
            {task.trashedAt && (
              <span className="ml-auto text-[10px] text-red-400/70 dark:text-red-500/40">
                <TrashedAgo iso={task.trashedAt} />
              </span>
            )}
            <ChevronDown
              className={`h-3 w-3 text-zinc-300 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:text-zinc-700 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Expand */}
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

      {confirmDelete && (
        <ConfirmDeleteModal
          title="Delete permanently?"
          message="This task, its notes, and all provenance history will be permanently removed. This cannot be undone."
          confirmLabel="Delete forever"
          onConfirm={() => {
            setConfirmDelete(false);
            onPermanentDelete(task.id);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// =============================================================
// TRASH DRAWER
// =============================================================

export function TrashDrawer({
  tasks: initialTasks,
  open,
  onClose,
  onTaskRestored,
  onTaskDeleted,
  onTrashEmptied,
}: {
  tasks: NodalTask[];
  open: boolean;
  onClose: () => void;
  onTaskRestored?: (taskId: string) => void;
  onTaskDeleted?: (taskId: string) => void;
  onTrashEmptied?: () => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchText, setSearchText] = useState("");
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 350);
    } else {
      setSearchText("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleRestore = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTaskRestored?.(taskId);
      toast("Restored to dashboard");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restoreFromTrash", taskId }),
      });
    },
    [toast, onTaskRestored],
  );

  const handlePermanentDelete = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTaskDeleted?.(taskId);
      toast("Permanently deleted");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "permanentDelete", taskId }),
      });
    },
    [toast, onTaskDeleted],
  );

  const handleEmptyTrash = useCallback(async () => {
    setConfirmEmptyAll(false);
    const count = tasks.length;
    setTasks([]);
    onTrashEmptied?.();
    toast(`${count} task${count !== 1 ? "s" : ""} permanently deleted`);
    await fetch("/api/tasks/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "emptyTrash" }),
    });
  }, [tasks.length, toast, onTrashEmptied]);

  const filtered = useMemo(() => {
    if (!searchText) return tasks;
    const q = searchText.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q)),
    );
  }, [tasks, searchText]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm transition-opacity duration-300 dark:bg-black/60 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 right-0 top-0 z-[9991] flex w-[480px] max-w-[90vw] flex-col border-l border-zinc-200 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.08)] transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-zinc-800/60 dark:bg-[#0f0f14] dark:shadow-[-20px_0_60px_rgba(0,0,0,0.5)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 pb-4 pt-5 dark:border-zinc-800/50">
          <Trash2 className="h-4 w-4 text-red-400 dark:text-red-500/70" />
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            Trash
          </h2>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
          {tasks.length > 0 && (
            <button
              onClick={() => setConfirmEmptyAll(true)}
              className="ml-auto mr-2 rounded-lg px-2.5 py-1 text-[11px] font-medium text-red-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-red-500/70 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              Empty trash
            </button>
          )}
          <button
            onClick={onClose}
            className={`${tasks.length === 0 ? "ml-auto" : ""} flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        {tasks.length > 0 && (
          <div className="shrink-0 px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search trash..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    if (searchText) {
                      setSearchText("");
                    } else {
                      onClose();
                    }
                  }
                }}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300/30 dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700 dark:focus:ring-zinc-700/20"
              />
            </div>
          </div>
        )}

        {/* Auto-delete notice */}
        {tasks.length > 0 && (
          <div className="shrink-0 px-5 pb-2">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
              Items are permanently deleted after 30 days.
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-none">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Inbox className="mb-3 h-10 w-10 animate-float text-zinc-200 dark:text-zinc-800" />{" "}
              <p className="text-[13px] text-zinc-400 dark:text-zinc-600">
                {tasks.length === 0
                  ? "Trash is empty"
                  : `No results for "${searchText}"`}
              </p>
              {searchText && (
                <button
                  className="mt-2 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  onClick={() => setSearchText("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((task, i) => (
                <TrashedCard
                  key={task.id}
                  task={task}
                  index={i}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty trash confirmation */}
      {confirmEmptyAll && (
        <ConfirmDeleteModal
          title="Empty trash?"
          message={`${tasks.length} task${tasks.length !== 1 ? "s" : ""} will be permanently deleted. This cannot be undone.`}
          confirmLabel="Empty trash"
          onConfirm={handleEmptyTrash}
          onCancel={() => setConfirmEmptyAll(false)}
        />
      )}
    </>,
    document.body,
  );
}
