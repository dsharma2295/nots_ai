"use client";

import { useLiveRelativeTime } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
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
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AIResponseCard, AIResponseLoading } from "./ai-response";
import {
  CreateNoteModal,
  NoteChips,
  type NoteData,
  ViewNoteModal,
} from "./note-modal";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";
import { useToast } from "./toast";

// =============================================================
// HELPERS
// =============================================================

function LiveTime({ iso }: { iso: string }) {
  const t = useLiveRelativeTime(iso);
  return <>{t}</>;
}

// =============================================================
// RESOLVED CARD (inside drawer)
// =============================================================

function ResolvedCard({
  task,
  index,
  onRestore,
  onBookmark,
}: {
  task: NodalTask;
  index: number;
  onRestore: (taskId: string) => void;
  onBookmark: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [viewingNote, setViewingNote] = useState<NoteData | null>(null);
  const { toast } = useToast();

  const platforms = [...new Set(task.sourceEvents.map((e) => e.platform))];
  const attachCount = task.sourceEvents.reduce(
    (a, e) => a + e.attachments.length,
    0,
  );

  // Fetch notes on expand
  useEffect(() => {
    if (expanded && !notesLoaded) {
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", taskId: task.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.notes) setNotes(data.notes);
          setNotesLoaded(true);
        })
        .catch(() => setNotesLoaded(true));
    }
  }, [expanded, notesLoaded, task.id]);

  const handleNoteCreated = useCallback(
    (note: NoteData) => {
      setNotes((prev) => [note, ...prev]);
      toast("Note added");
    },
    [toast],
  );

  const handleNoteUpdated = useCallback(
    (updated: NoteData) => {
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      toast("Note saved");
    },
    [toast],
  );

  const handleNoteDeleted = useCallback(
    (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast("Note deleted");
    },
    [toast],
  );

  const noteCount = notesLoaded ? notes.length : (task.noteCount ?? 0);

  return (
    <>
      <div
        className="group/card rounded-xl border border-zinc-200 bg-white opacity-60 transition-all duration-300 hover:opacity-100 dark:border-zinc-800/60 dark:bg-zinc-900/40"
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
          {/* Row 1: check + title + actions */}
          <div className="mb-2 flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <h3 className="flex-1 text-[13px] font-medium leading-snug text-zinc-500 line-through dark:text-zinc-400">
              {task.title}
            </h3>
            {/* Note indicator */}
            {noteCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 dark:text-indigo-400">
                <NotebookPen className="h-3 w-3" />
                {noteCount}
              </span>
            )}
            {/* Add note */}
            <button
              title="Add note"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover/card:opacity-100 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateNote(true);
              }}
            >
              <NotebookPen className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
            </button>
            {/* Bookmark */}
            <button
              title={task.bookmarked ? "Remove bookmark" : "Bookmark"}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-all group-hover/card:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(task.id);
              }}
            >
              <Bookmark
                className={`h-3 w-3 transition-colors ${
                  task.bookmarked
                    ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                    : "text-zinc-400 hover:text-blue-400 dark:text-zinc-600 dark:hover:text-blue-400"
                }`}
              />
            </button>
            {/* Restore */}
            <button
              title="Restore to dashboard"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
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
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
              {task.intent}
            </span>
            <span className="ml-auto text-[10px] tabular-nums text-zinc-400 dark:text-zinc-600">
              <LiveTime iso={task.updatedAt} />
            </span>
            <ChevronDown
              className={`h-3 w-3 text-zinc-300 transition-transform duration-300 dark:text-zinc-700 ${
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
            {/* Notes */}
            {notesLoaded && notes.length > 0 && (
              <div className="border-t border-zinc-100 px-4 pb-0 pt-3 dark:border-zinc-800/50">
                <NoteChips
                  notes={notes}
                  onClickNote={(note) => setViewingNote(note)}
                />
              </div>
            )}
            {/* Provenance */}
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

      {/* Note modals */}
      {showCreateNote && (
        <CreateNoteModal
          taskId={task.id}
          sourceEvents={task.sourceEvents}
          onClose={() => setShowCreateNote(false)}
          onCreate={handleNoteCreated}
        />
      )}
      {viewingNote && (
        <ViewNoteModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onUpdate={(updated) => {
            handleNoteUpdated(updated);
            setViewingNote(updated);
          }}
          onDelete={handleNoteDeleted}
        />
      )}
    </>
  );
}

// =============================================================
// RESOLVED DRAWER
// =============================================================

export function ResolvedDrawer({
  tasks: initialTasks,
  open,
  onClose,
  onTaskRestored,
}: {
  tasks: NodalTask[];
  open: boolean;
  onClose: () => void;
  onTaskRestored?: (taskId: string) => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const { toast } = useToast();

  // Sync with server when drawer opens
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

  // Focus search when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 350);
    } else {
      setSearchText("");
      setAiResponse(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

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

  // Task actions
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
    [toast],
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

  // Filtered
  const filtered = useMemo(() => {
    if (!filterText) return tasks;
    const q = filterText.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q)),
    );
  }, [tasks, filterText]);

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
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            Resolved
          </h2>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
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
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
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
                  <Inbox className="mb-3 h-10 w-10 text-zinc-200 dark:text-zinc-800" />
                  <p className="text-[13px] text-zinc-400 dark:text-zinc-600">
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
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes drawerCardIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 0.6;
            transform: translateX(0);
          }
        }
      `}</style>
    </>,
    document.body,
  );
}
