"use client";

import { useCmdK } from "@/lib/hooks";
import type { NodalTask } from "@/lib/mock-data";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Inbox,
  Paperclip,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { AIResponseCard, AIResponseLoading } from "./ai-response";
import { PlatformDot } from "./platform-icon";
import { SourceTimeline } from "./source-timeline";
import { useToast } from "./toast";

const PRIORITY_LABEL: Record<string, { text: string; color: string }> = {
  CRITICAL: {
    text: "Critical",
    color: "text-red-500 bg-red-50 dark:bg-red-500/10",
  },
  HIGH: {
    text: "High",
    color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
  },
  MEDIUM: {
    text: "Medium",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  },
  LOW: {
    text: "Low",
    color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60",
  },
};

const TIER_BADGE: Record<number, { label: string; className: string }> = {
  1: {
    label: "P1",
    className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
  },
  2: {
    label: "P2",
    className: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
  },
  3: {
    label: "P3",
    className: "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100",
  },
};

function groupByPriority(list: NodalTask[]) {
  const result: { label: string; color: string; tasks: NodalTask[] }[] = [];
  for (const key of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
    const matching = list
      .filter((t) => t.priority === key)
      .sort((a, b) => {
        const tierA = a.tier || 99;
        const tierB = b.tier || 99;
        if (tierA !== tierB) return tierA - tierB;
        const latestA =
          a.sourceEvents.length > 0
            ? Math.max(
                ...a.sourceEvents.map((e) => new Date(e.timestamp).getTime()),
              )
            : new Date(a.createdAt).getTime();
        const latestB =
          b.sourceEvents.length > 0
            ? Math.max(
                ...b.sourceEvents.map((e) => new Date(e.timestamp).getTime()),
              )
            : new Date(b.createdAt).getTime();
        return latestB - latestA;
      });
    if (matching.length > 0) {
      const pl = PRIORITY_LABEL[key];
      result.push({ label: pl.text, color: pl.color, tasks: matching });
    }
  }
  return result;
}

export function BookmarkedStream({
  tasks: initialTasks,
}: {
  tasks: NodalTask[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  // Search + AI state
  const [searchText, setSearchText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useCmdK(searchRef);

  const isAiMode = searchText.startsWith("/");
  const filterText = isAiMode ? "" : searchText;

  // AI query
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
      if (data.text) {
        setAiResponse(data as AIQueryResponse);
      }
    } catch (err) {
      console.error("[AI Query] Failed:", err);
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

  // AI action execution
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

  function handleSearchChange(value: string) {
    setSearchText(value);
    if (!value) setAiResponse(null);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isAiMode && searchText.length > 1) {
      e.preventDefault();
      executeAiQuery(searchText);
    }
    if (e.key === "Escape") {
      setAiResponse(null);
      setSearchText("");
      searchRef.current?.blur();
    }
  }

  // Task actions
  const handleRemoveBookmark = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast("Bookmark removed");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bookmark", taskId }),
      });
    },
    [toast],
  );

  const handleMarkDone = useCallback(
    async (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "DONE" as NodalTask["status"] } : t,
        ),
      );
      toast("Task resolved");
      await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          taskId,
          status: "DONE",
        }),
      });
    },
    [toast],
  );

  const handleRestore = useCallback(
    async (taskId: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "OPEN" as NodalTask["status"] } : t,
        ),
      );
      toast("Restored to active");
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

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!filterText) return tasks;
    const q = filterText.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q)),
    );
  }, [tasks, filterText]);

  const activeTasks = filteredTasks.filter(
    (t) => t.status !== "DONE" && t.status !== "ARCHIVED",
  );
  const resolvedTasks = filteredTasks.filter(
    (t) => t.status === "DONE" || t.status === "ARCHIVED",
  );
  const activeGrouped = groupByPriority(activeTasks);
  const resolvedGrouped = groupByPriority(resolvedTasks);

  // Render a single card
  function renderCard(task: NodalTask, i: number, isResolved: boolean) {
    const platforms = [...new Set(task.sourceEvents.map((e) => e.platform))];
    const attachCount = task.sourceEvents.reduce(
      (a, e) => a + e.attachments.length,
      0,
    );
    const isExpanded = expandedId === task.id;
    const tierBadge = task.tier > 0 ? TIER_BADGE[task.tier] : null;

    return (
      <div
        key={task.id}
        className={`group/card rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-md dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:shadow-lg dark:hover:shadow-black/20 ${
          isResolved ? "opacity-60 hover:opacity-100" : ""
        }`}
        style={{
          animation: "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
          animationDelay: `${i * 40}ms`,
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpandedId(isExpanded ? null : task.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              setExpandedId(isExpanded ? null : task.id);
          }}
          className="w-full cursor-pointer px-4 py-3.5 text-left"
        >
          {/* Row 1: icon + tier + attachments + time + actions */}
          <div className="mb-2 flex items-center gap-2">
            {isResolved ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <button
                title="Remove bookmark"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBookmark(task.id);
                }}
                className="shrink-0"
              >
                <Bookmark className="h-3.5 w-3.5 fill-blue-500 text-blue-500 transition-colors hover:fill-red-400 hover:text-red-400 dark:fill-blue-400 dark:text-blue-400 dark:hover:fill-red-400 dark:hover:text-red-400" />
              </button>
            )}
            {tierBadge && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${tierBadge.className}`}
              >
                {tierBadge.label}
              </span>
            )}
            {attachCount > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                <Paperclip className="h-3 w-3" />
                {attachCount}
              </span>
            )}
            {/* Mark done or Restore */}
            {isResolved ? (
              <button
                title="Restore to active"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestore(task.id);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                title="Mark done"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover/card:opacity-100 dark:text-zinc-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkDone(task.id);
                }}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Row 2: Title */}
          <h3
            className={`mb-2.5 text-[14px] font-medium leading-snug tracking-tight ${
              isResolved
                ? "text-zinc-500 line-through dark:text-zinc-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {task.title}
          </h3>

          {/* Row 3: platforms + sources + intent + chevron */}
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
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Expand */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
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

  // Empty state
  if (tasks.length === 0 && !aiLoading && !aiResponse) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800/40">
        <Inbox className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-800" />
        <p className="text-sm text-zinc-500 dark:text-zinc-600">
          No bookmarked tasks
        </p>
        <Link
          href="/"
          className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ─── DUAL-MODE SEARCH BAR ─── */}
      <div className="relative mb-5">
        {isAiMode ? (
          <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 dark:text-indigo-400" />
        ) : (
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
        )}
        <input
          ref={searchRef}
          type="text"
          placeholder={
            isAiMode
              ? "Ask anything about your bookmarks... (Enter to send)"
              : "Search bookmarks...  ⌘K  |  / for AI"
          }
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className={`h-10 w-full rounded-xl pl-10 pr-4 text-sm outline-none transition-all duration-300 ${
            isAiMode
              ? "border-indigo-400 bg-indigo-50 text-indigo-900 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30 placeholder:text-indigo-400 dark:border-indigo-500/40 dark:bg-indigo-500/[0.06] dark:text-indigo-100 dark:shadow-indigo-500/5 dark:ring-indigo-500/20 dark:placeholder:text-indigo-500/60"
              : "border border-zinc-200 bg-white text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:shadow-inner dark:shadow-black/20 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
          }`}
        />
        {isAiMode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
            AI
          </div>
        )}
      </div>

      {/* ─── AI RESPONSE ─── */}
      {(aiLoading || aiResponse) && (
        <div className="mb-5">
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

      {/* ─── TWO-COLUMN LAYOUT ─── */}
      {!isAiMode && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Saved column */}
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Saved
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[11px] text-zinc-400">
                {activeTasks.length}
              </span>
            </div>
            {activeTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800/40">
                <p className="text-[12px] text-zinc-400 dark:text-zinc-600">
                  No saved bookmarks
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGrouped.map((group) => (
                  <div key={group.label}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${group.color}`}
                      >
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/40" />
                      <span className="text-[11px] text-zinc-400">
                        {group.tasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task, i) => renderCard(task, i, false))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved column */}
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                Resolved
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[11px] text-zinc-400">
                {resolvedTasks.length}
              </span>
            </div>
            {resolvedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800/40">
                <p className="text-[12px] text-zinc-400 dark:text-zinc-600">
                  No resolved bookmarks
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resolvedGrouped.map((group) => (
                  <div key={`resolved-${group.label}`}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${group.color}`}
                      >
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/40" />
                      <span className="text-[11px] text-zinc-400">
                        {group.tasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task, i) => renderCard(task, i, true))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No results for filter */}
      {!isAiMode && filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800/40">
          <Inbox className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-800" />
          <p className="text-sm text-zinc-500 dark:text-zinc-600">
            No bookmarks match &ldquo;{filterText}&rdquo;
          </p>
          <button
            className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            onClick={() => setSearchText("")}
          >
            Clear search
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
