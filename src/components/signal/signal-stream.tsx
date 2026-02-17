"use client";

import { useCmdK } from "@/lib/hooks";
import type { NodalTask, Platform, TaskStatus } from "@/lib/mock-data";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Flame,
  Inbox,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { AIResponseCard, AIResponseLoading } from "./ai-response";
import { getPlatformFilterStyle } from "./platform-icon";
import { TaskCard } from "./task-card";
import { TaskCardSkeleton } from "./task-card-skeleton";
// =============================================================
// CONSTANTS
// =============================================================

const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

interface Filters {
  platforms: Set<Platform>;
  statuses: Set<TaskStatus>;
  showReviewOnly: boolean;
  search: string;
  selectedDate: string | null;
}

// =============================================================
// TIME GROUPING
// =============================================================

function getTimeGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= weekAgo) return "This Week";
  return "Earlier";
}

function groupByTime(
  tasks: NodalTask[],
): { label: string; tasks: NodalTask[] }[] {
  const order = ["Today", "Yesterday", "This Week", "Earlier"];
  const groups: Record<string, NodalTask[]> = {};
  for (const t of tasks) {
    const g = getTimeGroup(t.updatedAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  }
  return order
    .filter((l) => groups[l]?.length)
    .map((l) => ({ label: l, tasks: groups[l] }));
}

// =============================================================
// MINI CALENDAR
// =============================================================

function MiniCalendar({
  taskDates,
  selectedDate,
  onSelectAction,
}: {
  taskDates: Set<string>;
  selectedDate: string | null;
  onSelectAction: (date: string | null) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = viewDate.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

  function dateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
          {monthName}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-medium text-zinc-400 dark:text-zinc-600">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) return <span key={i} className="h-6 w-6" />;
          const ds = dateStr(day);
          const hasTask = taskDates.has(ds);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          return (
            <button
              key={i}
              onClick={() => onSelectAction(isSelected ? null : ds)}
              className={`relative flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium transition-all duration-150 ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-sm"
                  : isToday
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : hasTask
                      ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      : "text-zinc-300 dark:text-zinc-700"
              }`}
            >
              {day}
              {hasTask && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button
          onClick={() => onSelectAction(null)}
          className="mt-2 w-full rounded-md py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}

// =============================================================
// SMART STATS — now includes resolved link
// =============================================================

function SmartStats({ tasks }: { tasks: NodalTask[] }) {
  const needAttention = tasks.filter(
    (t) =>
      (t.priority === "CRITICAL" || t.priority === "HIGH") &&
      t.status === "OPEN",
  ).length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const review = tasks.filter((t) => t.needsReview).length;
  const done = tasks.filter((t) => t.status === "DONE").length;

  const items = [
    needAttention > 0 && {
      icon: Flame,
      count: needAttention,
      label: "need attention",
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
    blocked > 0 && {
      icon: Minus,
      count: blocked,
      label: "blocked",
      color: "text-red-500 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    review > 0 && {
      icon: AlertTriangle,
      count: review,
      label: "need review",
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    done > 0 && {
      icon: Zap,
      count: done,
      label: "resolved",
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
  ].filter(Boolean) as {
    icon: typeof Flame;
    count: number;
    label: string;
    color: string;
    bg: string;
  }[];

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${item.bg}`}
        >
          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
          <span className={item.color}>{item.count}</span>
          <span className="text-zinc-500">{item.label}</span>
        </div>
      ))}
      <Link
        href="/bookmarks"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Bookmarks
      </Link>

      <Link
        href="/resolved"
        className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-indigo-500 dark:text-zinc-600 dark:hover:text-indigo-400"
      >
        <Archive className="h-3.5 w-3.5" />
        View resolved
      </Link>
    </div>
  );
}

// =============================================================
// KANBAN COLUMN
// =============================================================

function KanbanColumn({
  title,
  icon: Icon,
  iconColor,
  tasks,
  totalIndex,
  onTaskActionExec,
}: {
  title: string;
  icon: typeof Flame;
  iconColor: string;
  tasks: NodalTask[];
  totalIndex: number;
  onTaskActionExec: (
    taskId: string,
    action: string,
    value?: string,
  ) => Promise<void>;
}) {
  const PRIORITY_WEIGHT: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  const sorted = [...tasks].sort((a, b) => {
    const tierA = a.tier || 99;
    const tierB = b.tier || 99;
    if (tierA !== tierB) return tierA - tierB;
    // Same tier (or both unranked) — sort by AI priority
    return (
      (PRIORITY_WEIGHT[a.priority] ?? 4) - (PRIORITY_WEIGHT[b.priority] ?? 4)
    );
  });
  const timeGroups = groupByTime(sorted);
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/80">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
          {title}
        </span>
        <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800/40">
            <p className="text-[12px] text-zinc-400 dark:text-zinc-600">
              No tasks
            </p>
          </div>
        ) : (
          timeGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/40" />
              </div>
              <div className="space-y-2">
                {group.tasks.map((t, i) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    index={totalIndex + i}
                    onTaskActionExec={onTaskActionExec}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================
// SIGNAL STREAM (Main Component)
// =============================================================

export function SignalStream({
  tasks: serverTasks,
  isLoading = false,
}: {
  tasks: NodalTask[];
  isLoading?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useCmdK(searchRef);

  // Local task state for optimistic updates (done removal, priority, tier)
  const [localTasks, setLocalTasks] = useState(serverTasks);
  const pendingRef = useRef<Set<string>>(new Set());
  const prevRef = useRef(serverTasks);
  if (prevRef.current !== serverTasks) {
    prevRef.current = serverTasks;
    setLocalTasks((current) =>
      serverTasks.map((serverTask) => {
        if (pendingRef.current.has(serverTask.id)) {
          const localVersion = current.find((t) => t.id === serverTask.id);
          return localVersion ?? serverTask;
        }
        return serverTask;
      }),
    );
  }
  const [filters, setFilters] = useState<Filters>({
    platforms: new Set(ALL_PLATFORMS),
    statuses: new Set(ALL_STATUSES),
    showReviewOnly: false,
    search: "",
    selectedDate: null,
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // AI mode state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);

  const isAiMode = filters.search.startsWith("/");
  const filterText = isAiMode ? "" : filters.search;

  function tog<T>(set: Set<T>, val: T): Set<T> {
    const n = new Set(set);
    if (n.has(val)) n.delete(val);
    else n.add(val);
    return n;
  }

  // Execute AI query
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

  // Execute AI action
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

  // Execute task card actions — with optimistic updates + pending guard
  const executeTaskAction = useCallback(
    async (taskId: string, action: string, value?: string) => {
      pendingRef.current.add(taskId);

      // Optimistic update
      if (action === "done") {
        setTimeout(() => {
          setLocalTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: "DONE" as NodalTask["status"] }
                : t,
            ),
          );
        }, 500);
      } else if (action === "priority" && value) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, priority: value as NodalTask["priority"] }
              : t,
          ),
        );
      } else if (action === "tier" && value) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, tier: parseInt(value, 10) } : t,
          ),
        );
      } else if (action === "bookmark") {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, bookmarked: !t.bookmarked } : t,
          ),
        );

      const body =
        action === "done"
          ? { action: "updateStatus", taskId, status: "DONE" }
          : action === "priority" && value
            ? { action: "updatePriority", taskId, priority: value }
            : action === "tier" && value
              ? { action: "updateTier", taskId, tier: parseInt(value, 10) }
              : action === "bookmark"
              ? { action: "bookmark", taskId }
              : null;

      if (!body) {
        pendingRef.current.delete(taskId);
        return;
      }

      try {
        await fetch("/api/tasks/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } finally {
        setTimeout(() => {
          pendingRef.current.delete(taskId);
        }, 5000);
      }
    },
    [],
  );
  // Handle search
  function handleSearchChange(value: string) {
    setFilters((f) => ({ ...f, search: value }));
    if (!value) {
      setAiResponse(null);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isAiMode && filters.search.length > 1) {
      e.preventDefault();
      executeAiQuery(filters.search);
    }
    if (e.key === "Escape") {
      setAiResponse(null);
      setFilters((f) => ({ ...f, search: "" }));
      searchRef.current?.blur();
    }
  }

  // Filtered tasks — use localTasks for optimistic updates
  const filtered = useMemo(() => {
    return localTasks.filter((t) => {
      if (t.status === "DONE" || t.status === "ARCHIVED") return false;
      const tp = new Set(t.sourceEvents.map((e) => e.platform));
      if (![...tp].some((p) => filters.platforms.has(p))) return false;
      if (!filters.statuses.has(t.status)) return false;
      if (filters.showReviewOnly && !t.needsReview) return false;
      if (filterText) {
        const q = filterText.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.selectedDate) {
        const td = new Date(t.updatedAt);
        const ds = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
        if (ds !== filters.selectedDate) return false;
      }
      return true;
    });
  }, [localTasks, filters, filterText]);

  const urgent = filtered.filter(
    (t) => t.priority === "CRITICAL" || t.priority === "HIGH",
  );
  const active = filtered.filter((t) => t.priority === "MEDIUM");
  const low = filtered.filter((t) => t.priority === "LOW");

  const taskDates = useMemo(() => {
    const s = new Set<string>();
    for (const t of localTasks) {
      const d = new Date(t.updatedAt);
      s.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      );
    }
    return s;
  }, [localTasks]);

  const reviewCount = localTasks.filter((t) => t.needsReview).length;

  // Filter pill helper
  const pill = (
    act: boolean,
    actStyle: string,
    label: string,
    onClick: () => void,
  ) => (
    <button
      key={label}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200 active:scale-[0.97] ${
        act
          ? actStyle
          : "text-zinc-400 ring-1 ring-zinc-200 hover:ring-zinc-300 dark:text-zinc-600 dark:ring-zinc-800 dark:hover:ring-zinc-700"
      }`}
    >
      {label}
    </button>
  );

  const filterBar = (
    <div className="flex flex-wrap items-center gap-1.5">
      {ALL_PLATFORMS.map((p) => {
        const a = filters.platforms.has(p);
        const s = getPlatformFilterStyle(p);
        return pill(a, s.active, p.charAt(0) + p.slice(1).toLowerCase(), () =>
          setFilters((f) => ({ ...f, platforms: tog(f.platforms, p) })),
        );
      })}
      <div className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
      {ALL_STATUSES.map((s) => {
        const a = filters.statuses.has(s);
        const label =
          s === "IN_PROGRESS"
            ? "Active"
            : s.charAt(0) + s.slice(1).toLowerCase();
        return pill(
          a,
          "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300 dark:bg-zinc-700/30 dark:text-zinc-300 dark:ring-zinc-600/30",
          label,
          () => setFilters((f) => ({ ...f, statuses: tog(f.statuses, s) })),
        );
      })}
      {reviewCount > 0 && (
        <>
          <div className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
          <button
            onClick={() =>
              setFilters((f) => ({ ...f, showReviewOnly: !f.showReviewOnly }))
            }
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
              filters.showReviewOnly
                ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/25"
                : "text-zinc-400 ring-1 ring-zinc-200 dark:text-zinc-600 dark:ring-zinc-800"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {reviewCount}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div>
      <SmartStats tasks={localTasks} />

      {/* Search bar */}
      <div className="relative mb-4">
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
              ? "Ask anything about your tasks... (Enter to send)"
              : "Search tasks...  ⌘K  |  / for AI"
          }
          value={filters.search}
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

      {/* AI Response */}
      {(aiLoading || aiResponse) && (
        <div className="mb-5">
          {aiLoading ? (
            <AIResponseLoading />
          ) : aiResponse ? (
            <AIResponseCard
              response={aiResponse}
              onDismiss={() => {
                setAiResponse(null);
                setFilters((f) => ({ ...f, search: "" }));
              }}
              onExecuteAction={executeAiAction}
            />
          ) : null}
        </div>
      )}

      {/* Filters */}
      {!isAiMode && (
        <>
          <div className="mb-5 hidden md:block">{filterBar}</div>
          <div className="mb-5 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </span>
              <span className="text-[11px] text-zinc-400">
                {filters.platforms.size}/{ALL_PLATFORMS.length}
              </span>
            </button>
            {mobileOpen && (
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                {filterBar}
              </div>
            )}
          </div>
        </>
      )}

      {/* Main layout */}
      {!isAiMode && (
        <div className="flex gap-5">
          <div className="hidden w-48 shrink-0 lg:block">
            <MiniCalendar
              taskDates={taskDates}
              selectedDate={filters.selectedDate}
              onSelectAction={(d) =>
                setFilters((f) => ({ ...f, selectedDate: d }))
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TaskCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800/40">
                <Inbox className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-800" />
                <p className="text-sm text-zinc-500 dark:text-zinc-600">
                  No signals found
                </p>
                <button
                  className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  onClick={() =>
                    setFilters({
                      platforms: new Set(ALL_PLATFORMS),
                      statuses: new Set(ALL_STATUSES),
                      showReviewOnly: false,
                      search: "",
                      selectedDate: null,
                    })
                  }
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <KanbanColumn
                  title="Urgent"
                  icon={Flame}
                  iconColor="text-orange-500 dark:text-orange-400"
                  tasks={urgent}
                  totalIndex={0}
                  onTaskActionExec={executeTaskAction}
                />
                <KanbanColumn
                  title="Active"
                  icon={Zap}
                  iconColor="text-blue-500 dark:text-blue-400"
                  tasks={active}
                  totalIndex={urgent.length}
                  onTaskActionExec={executeTaskAction}
                />
                <KanbanColumn
                  title="Low Priority"
                  icon={Minus}
                  iconColor="text-zinc-400 dark:text-zinc-500"
                  tasks={low}
                  totalIndex={urgent.length + active.length}
                  onTaskActionExec={executeTaskAction}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-zinc-300 dark:text-zinc-700">
        <span className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
        Noise → Signal
        <span className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
      </div>

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
