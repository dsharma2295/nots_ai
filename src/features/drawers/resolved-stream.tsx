"use client";
import { PlatformIcon } from "@/components/platform-icon";
import { useToast } from "@/components/toast";
import { AIResponseCard, AIResponseLoading } from "@/features/ai/ai-response";
import { SourceTimeline } from "@/features/timeline/source-timeline";
import { useCmdK } from "@/hooks";
import type { NodalTask } from "@/lib/mock-data";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import {
  Bookmark,
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

export function ResolvedStream({
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

  const handleRestore = useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
  ); // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!filterText) return tasks;
    const q = filterText.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q)),
    );
  }, [tasks, filterText]);

  if (tasks.length === 0 && !aiLoading && !aiResponse) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800/40">
        <Inbox className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-800" />
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          No resolved tasks yet
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
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        )}
        <input
          ref={searchRef}
          type="text"
          placeholder={
            isAiMode
              ? "Ask anything about resolved tasks... (Enter to send)"
              : "Search resolved...  ⌘K  |  / for AI"
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

      {/* ─── TASK LIST ─── */}
      {!isAiMode && (
        <div className="space-y-2">
          {filteredTasks.map((task, i) => {
            const platforms = [
              ...new Set(task.sourceEvents.map((e) => e.platform)),
            ];
            const attachCount = task.sourceEvents.reduce(
              (a, e) => a + e.attachments.length,
              0,
            );
            const isExpanded = expandedId === task.id;

            return (
              <div
                key={task.id}
                className="group/card rounded-xl border border-zinc-200 bg-white opacity-60 transition-all duration-300 hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800"
                style={{
                  animation:
                    "cardSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) backwards",
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
                  {/* Row 1: Done icon + title + actions */}
                  <div className="mb-2 flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <h3 className="flex-1 text-[14px] font-medium leading-snug text-zinc-500 line-through dark:text-zinc-400">
                      {task.title}
                    </h3>
                    {/* Bookmark */}
                    <button
                      title={task.bookmarked ? "Remove bookmark" : "Bookmark"}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all group-hover/card:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(task.id);
                      }}
                    >
                      <Bookmark
                        className={`h-3.5 w-3.5 transition-colors ${
                          task.bookmarked
                            ? "fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                            : "text-zinc-400 hover:text-blue-400 dark:text-zinc-500 dark:hover:text-blue-400"
                        }`}
                      />
                    </button>
                    {/* Restore */}
                    <button
                      title="Restore to dashboard"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover/card:opacity-100 dark:text-zinc-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(task.id);
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Meta */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-1">
                      {platforms.map((p) => (
                        <PlatformIcon
                          key={p}
                          platform={
                            p as NodalTask["sourceEvents"][0]["platform"]
                          }
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {task.sourceEvents.length} source
                      {task.sourceEvents.length !== 1 ? "s" : ""}
                    </span>
                    {attachCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <Paperclip className="h-3 w-3" />
                        {attachCount}
                      </span>
                    )}

                    <ChevronDown
                      className={`h-3.5 w-3.5 text-zinc-300 transition-transform duration-300 dark:text-zinc-500 ${
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
            );
          })}

          {/* No results for filter */}
          {filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800/40">
              <Inbox className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-800" />
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                No resolved tasks match &ldquo;{filterText}&rdquo;
              </p>
              <button
                className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                onClick={() => setSearchText("")}
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
