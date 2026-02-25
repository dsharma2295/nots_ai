"use client";

import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { PlatformDot } from "@/components/platform-icon";
import { useToast } from "@/components/toast";
import { AIResponseCard, AIResponseLoading } from "@/features/ai/ai-response";
import { useListKeyboardNav } from "@/features/keyboard/hooks/use-list-keyboard-nav";
import {
  CreateNoteModal,
  NoteChips,
  ViewNoteModal,
} from "@/features/notes/note-modal";
import { SourceTimeline } from "@/features/timeline/source-timeline";
import { useLiveRelativeTime } from "@/hooks";
import { useNotes } from "@/hooks/use-notes";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import type { NodalTask } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Inbox,
  NotebookPen,
  Paperclip,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function LiveTime({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>{t}</>;
}

// =============================================================
// RESOLVED CARD — identical to current, only change is
// AnimatePresence wrapping ViewNoteModal for layoutId morph
// =============================================================

function ResolvedCard({
  task,
  index,
  onRestore,
  onBookmark,
  onDelete,
  onNoteCountChange,
  isKeyboardFocused = false,
}: {
  task: NodalTask;
  index: number;
  onRestore: (taskId: string) => void;
  onBookmark: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onNoteCountChange: (taskId: string, count: number) => void;
  isKeyboardFocused?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const notes = useNotes(task.id, expanded, onNoteCountChange);
  const noteCount = notes.count(task.noteCount ?? 0);

  const platforms = [...new Set(task.sourceEvents.map((e) => e.platform))];
  const attachCount = task.sourceEvents.reduce(
    (a, e) => a + e.attachments.length,
    0,
  );

  // Keyboard actions when focused
  useEffect(() => {
    if (!isKeyboardFocused) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Enter") {
        e.preventDefault();
        setExpanded((prev) => !prev);
      }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        notes.setShowCreate(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isKeyboardFocused, notes]);

  return (
    <>
      <div
        data-task-id={task.id}
        className={`group/card rounded-xl border border-zinc-200 bg-white opacity-60 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800 ${isKeyboardFocused ? "!opacity-100 ring-2 ring-indigo-500/50" : ""}`}
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
          {/* Row 1: check · title · trash · notes · bookmark · restore */}
          <div className="mb-2 flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <h3 className="flex-1 text-[13px] font-medium leading-snug text-zinc-500 line-through dark:text-zinc-400">
              {task.title}
            </h3>
            {/* Trash */}
            <button
              title="Delete task"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 group-hover/card:opacity-100 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
            {/* Notes */}
            <button
              title={
                noteCount > 0
                  ? `${noteCount} note${noteCount !== 1 ? "s" : ""}`
                  : "Add note"
              }
              className="flex h-6 shrink-0 items-center gap-0.5 rounded-md opacity-0 transition-all active:scale-90 group-hover/card:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                notes.setShowCreate(true);
              }}
            >
              <NotebookPen
                className={`h-3 w-3 transition-colors ${
                  noteCount > 0
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-zinc-400 hover:text-indigo-400 dark:text-zinc-500 dark:hover:text-indigo-400"
                }`}
              />
              {noteCount > 0 && (
                <span className="text-[10px] font-medium leading-none text-indigo-500 dark:text-indigo-400">
                  {noteCount}
                </span>
              )}
            </button>
            {/* Bookmark */}
            <button
              title={task.bookmarked ? "Remove bookmark" : "Bookmark"}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-all active:scale-90 group-hover/card:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(task.id);
              }}
            >
              <Bookmark
                className={`h-3 w-3 transition-colors ${
                  task.bookmarked
                    ? "fill-blue-500 text-blue-500 opacity-100 dark:fill-blue-400 dark:text-blue-400"
                    : "text-zinc-400 hover:text-blue-400 dark:text-zinc-500 dark:hover:text-blue-400"
                }`}
              />
            </button>
            {/* Restore */}
            <button
              title="Restore to dashboard"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 group-hover/card:opacity-100 dark:text-zinc-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(task.id);
              }}
            >
              <RotateCcw className="h-3 w-3" />
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
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {task.sourceEvents.length} message
              {task.sourceEvents.length !== 1 ? "s" : ""}
            </span>
            {attachCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                <Paperclip className="h-2.5 w-2.5" />
                {attachCount}
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
              {task.intent}
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
              <LiveTime iso={task.updatedAt} />
            </span>
            <ChevronDown
              className={`h-3 w-3 text-zinc-300 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:text-zinc-500 ${
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
      </div>
      {/* Modals */}
      {notes.showCreate && (
        <CreateNoteModal
          taskId={task.id}
          sourceEvents={task.sourceEvents}
          onClose={() => notes.setShowCreate(false)}
          onCreate={notes.onCreate}
        />
      )}
      {/* AnimatePresence needed for layoutId morph in ViewNoteModal */}
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
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(task.id);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// =============================================================
// RESOLVED DRAWER
// Change: CSS transition-transform replaced with Framer Motion
// spring physics (stiffness: 350, damping: 30, mass: 0.9).
// Backdrop fades in/out with AnimatePresence.
// All existing logic, keyboard nav, AI mode — identical.
// =============================================================

export function ResolvedDrawer({
  tasks: initialTasks,
  open,
  onClose,
  onTaskRestored,
  onTaskDeleted,
}: {
  tasks: NodalTask[];
  open: boolean;
  onClose: () => void;
  onTaskRestored?: (taskId: string) => void;
  onTaskDeleted?: (taskId: string) => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const { toast } = useToast();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Search + AI
  const [searchText, setSearchText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAiMode = searchText.startsWith("/");
  const filterText = isAiMode ? "" : searchText;

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 350);
    } else {
      setSearchText("");
      setAiResponse(null);
    }
  }, [open]);

  const executeAiQuery = useCallback(async (query: string) => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.slice(1).trim() }),
      });
      const data = await res.json();
      if (data.text) setAiResponse(data as AIQueryResponse);
    } catch {
      setAiResponse({
        text: "Something went wrong. Please try again.",
        actions: [],
        queryType: "summary",
        referencedTaskIds: [],
      });
    } finally {
      setAiLoading(false);
    }
  }, []);

  const executeAiAction = useCallback(
    async (action: AIQueryResponse["actions"][number]) => {
      const body =
        action.type === "createTask"
          ? {
              action: "createTask",
              title: action.title,
              intent: action.intent,
              priority: action.priority,
            }
          : action.type === "updateStatus"
            ? {
                action: "updateStatus",
                taskId: action.taskId,
                status: action.status,
              }
            : action.type === "updatePriority"
              ? {
                  action: "updatePriority",
                  taskId: action.taskId,
                  priority: action.priority,
                }
              : action.type === "snoozeTask"
                ? {
                    action: "snooze",
                    taskId: action.taskId,
                    snoozeUntil: action.until,
                  }
                : null;
      if (!body) return;
      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Action failed");
    },
    [],
  );

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isAiMode && searchText.length > 1) {
      e.preventDefault();
      executeAiQuery(searchText);
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      if (searchText) {
        setSearchText("");
        setAiResponse(null);
      } else {
        onClose();
      }
    }
  }

  const handleRestore = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTaskRestored?.(taskId);
      toast("Restored to dashboard");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          taskId,
          status: "OPEN",
        }),
      });
    },
    [toast, onTaskRestored],
  );

  const handleBookmark = useCallback(
    async (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, bookmarked: !t.bookmarked } : t,
        ),
      );
      toast("Bookmark updated");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bookmark", taskId }),
      });
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onTaskDeleted?.(taskId);
      toast("Moved to trash");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteTask", taskId }),
      });
    },
    [toast, onTaskDeleted],
  );

  const handleNoteCountChange = useCallback((taskId: string, count: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, noteCount: count } : t)),
    );
  }, []);

  const filtered = useMemo(() => {
    if (!filterText) return tasks;
    const q = filterText.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q)),
    );
  }, [tasks, filterText]);

  const handleKeyAction = useCallback(
    (id: string, key: string) => {
      if (key === "r") handleRestore(id);
      if (key === "b") handleBookmark(id);
      if (key === "t") handleDelete(id);
    },
    [handleRestore, handleBookmark, handleDelete],
  );

  const { focusedId, setFocusedId } = useListKeyboardNav({
    items: filtered,
    onAction: handleKeyAction,
    disabled: !open,
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (focusedId) {
          setFocusedId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, focusedId, setFocusedId]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Animated backdrop */}
          <motion.div
            key="resolved-backdrop"
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Spring drawer */}
          <motion.div
            key="resolved-drawer"
            className="fixed bottom-0 right-0 top-0 z-[9991] flex w-[480px] max-w-[90vw] flex-col border-l border-zinc-200 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.08)] dark:border-zinc-800/60 dark:bg-[#0f0f14] dark:shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.9,
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 pb-4 pt-5 dark:border-zinc-800/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                Resolved
              </h2>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={onClose}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 px-5 py-3">
              <div className="relative">
                {isAiMode ? (
                  <Sparkles className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                )}
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={
                    isAiMode
                      ? "Ask about resolved tasks... (Enter)"
                      : "Search resolved...  / for AI"
                  }
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    if (!e.target.value) setAiResponse(null);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className={`h-9 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none transition-all duration-200 ${
                    isAiMode
                      ? "border-indigo-400 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500/30 placeholder:text-indigo-400 dark:border-indigo-500/40 dark:bg-indigo-500/[0.06] dark:text-indigo-100 dark:ring-indigo-500/20 dark:placeholder:text-indigo-500/60"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300/30 dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700 dark:focus:ring-zinc-700/20"
                  }`}
                />
                {isAiMode && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-indigo-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    AI
                  </div>
                )}
              </div>
            </div>

            {/* AI Response */}
            {(aiLoading || aiResponse) && (
              <div className="shrink-0 px-5 pb-3">
                {aiLoading ? (
                  <AIResponseLoading />
                ) : aiResponse ? (
                  <AIResponseCard
                    response={aiResponse}
                    onDismiss={() => {
                      setAiResponse(null);
                      setSearchText("");
                    }}
                    onExecuteAction={executeAiAction}
                  />
                ) : null}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-none">
              {!isAiMode && (
                <>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Inbox className="mb-3 h-10 w-10 animate-float text-zinc-200 dark:text-zinc-800" />
                      <p className="text-[13px] text-zinc-400 dark:text-zinc-500">
                        {tasks.length === 0
                          ? "No resolved tasks yet"
                          : `No results for "${filterText}"`}
                      </p>
                      {filterText && (
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
                        <ResolvedCard
                          key={task.id}
                          task={task}
                          index={i}
                          onRestore={handleRestore}
                          onBookmark={handleBookmark}
                          onDelete={handleDelete}
                          onNoteCountChange={handleNoteCountChange}
                          isKeyboardFocused={focusedId === task.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
