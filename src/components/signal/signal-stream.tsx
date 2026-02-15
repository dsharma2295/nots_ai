"use client";

import { useCmdK, useCountUp } from "@/lib/hooks";
import type {
  NodalTask,
  Platform,
  Priority,
  TaskStatus,
} from "@/lib/mock-data";
import { Inbox, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { TaskCard } from "./task-card";
import { TaskCardSkeleton } from "./task-card-skeleton";

// =============================================================
// CONSTANTS
// =============================================================

const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
const ALL_PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

const PLATFORM_ACTIVE: Record<string, string> = {
  SLACK: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  GMAIL: "bg-red-500/10 text-red-400 border-red-500/30",
  JIRA: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  TRELLO: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  ASANA: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const PRIORITY_ACTIVE: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  LOW: "bg-zinc-600/10 text-zinc-400 border-zinc-600/30",
};

// =============================================================
// FILTER TYPES
// =============================================================

interface Filters {
  platforms: Set<Platform>;
  priorities: Set<Priority>;
  statuses: Set<TaskStatus>;
  showReviewOnly: boolean;
  search: string;
}

// =============================================================
// SIGNAL STREAM
// =============================================================

export function SignalStream({
  tasks,
  isLoading = false,
}: {
  tasks: NodalTask[];
  isLoading?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useCmdK(searchRef);

  const [filters, setFilters] = useState<Filters>({
    platforms: new Set(ALL_PLATFORMS),
    priorities: new Set(ALL_PRIORITIES),
    statuses: new Set(ALL_STATUSES),
    showReviewOnly: false,
    search: "",
  });

  const [sortBy, setSortBy] = useState<"updated" | "priority">("updated");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Drag reorder state
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const dragIdx = useRef<number | null>(null);

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  // Apply filters + sorting
  const filtered = useMemo(() => {
    const result = tasks.filter((t) => {
      const taskPlatforms = new Set(t.sourceEvents.map((e) => e.platform));
      const hasPlatform = [...taskPlatforms].some((p) =>
        filters.platforms.has(p),
      );
      if (!hasPlatform) return false;
      if (!filters.priorities.has(t.priority)) return false;
      if (!filters.statuses.has(t.status)) return false;
      if (filters.showReviewOnly && !t.needsReview) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesContent = t.sourceEvents.some((e) =>
          e.rawContent.toLowerCase().includes(q),
        );
        if (!matchesTitle && !matchesContent) return false;
      }
      return true;
    });

    if (sortBy === "updated") {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    } else {
      const pOrder: Record<Priority, number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };
      result.sort((a, b) => pOrder[a.priority] - pOrder[b.priority]);
    }

    // Apply custom drag order if set
    if (taskOrder.length > 0) {
      result.sort((a, b) => {
        const ai = taskOrder.indexOf(a.id);
        const bi = taskOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }

    return result;
  }, [tasks, filters, sortBy, taskOrder]);

  // Stats
  const reviewCount = tasks.filter((t) => t.needsReview).length;
  const totalSources = tasks.reduce((acc, t) => acc + t.sourceEvents.length, 0);
  const animatedTasks = useCountUp(filtered.length);
  const animatedSources = useCountUp(totalSources);

  // Drag handlers
  const handleDragStart = useCallback((_e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, dropIdx: number) => {
      if (dragIdx.current === null || dragIdx.current === dropIdx) return;
      const ids = filtered.map((t) => t.id);
      const [moved] = ids.splice(dragIdx.current, 1);
      ids.splice(dropIdx, 0, moved);
      setTaskOrder(ids);
      dragIdx.current = null;
    },
    [filtered],
  );

  // Filter bar content (shared between desktop and mobile)
  const filterContent = (
    <>
      {/* Platform toggles */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ALL_PLATFORMS.map((p) => {
          const active = filters.platforms.has(p);
          return (
            <button
              key={p}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  platforms: toggle(f.platforms, p),
                }))
              }
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200 ease-out active:scale-95 ${
                active
                  ? PLATFORM_ACTIVE[p]
                  : "border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Priority + Status + Sort */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ALL_PRIORITIES.map((p) => {
          const active = filters.priorities.has(p);
          return (
            <button
              key={p}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  priorities: toggle(f.priorities, p),
                }))
              }
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200 ease-out active:scale-95 ${
                active
                  ? PRIORITY_ACTIVE[p]
                  : "border-zinc-800 bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px border-r border-zinc-800" />

        {ALL_STATUSES.map((s) => {
          const active = filters.statuses.has(s);
          const label =
            s === "IN_PROGRESS"
              ? "In progress"
              : s.charAt(0) + s.slice(1).toLowerCase();
          return (
            <button
              key={s}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  statuses: toggle(f.statuses, s),
                }))
              }
              className={`rounded-md border px-2 py-1 text-[11px] transition-all duration-200 active:scale-95 ${
                active
                  ? "border-zinc-600 bg-zinc-700/30 text-zinc-300"
                  : "border-zinc-800 bg-transparent text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {label}
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px border-r border-zinc-800" />

        <button
          onClick={() =>
            setSortBy(sortBy === "updated" ? "priority" : "updated")
          }
          className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-all duration-200 hover:bg-zinc-800/50 hover:text-zinc-300 active:scale-95"
        >
          {sortBy === "updated" ? "↓ Latest" : "↓ Priority"}
        </button>

        {reviewCount > 0 && (
          <button
            onClick={() =>
              setFilters((f) => ({
                ...f,
                showReviewOnly: !f.showReviewOnly,
              }))
            }
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200 active:scale-95 ${
              filters.showReviewOnly
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            Review ({reviewCount})
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* ==== HEADER ==== */}
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 shadow-lg shadow-black/30 ring-1 ring-white/5">
            <span className="text-lg font-black tracking-tight text-white">
              N
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">
              Nots<span className="text-zinc-500">.ai</span>
            </h1>
            <p className="text-[13px] text-zinc-500">
              Cut the Noise, Keep the Context
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-5 flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-100">{animatedTasks}</span>
            <span className="text-zinc-500">tasks</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-100">
              {animatedSources}
            </span>
            <span className="text-zinc-500">sources</span>
          </div>
          {reviewCount > 0 && (
            <>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-amber-400">
                  {reviewCount}
                </span>
                <span className="text-zinc-500">need review</span>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search tasks...  ⌘K"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-9 pr-3 text-sm text-zinc-100 shadow-inner placeholder:text-zinc-500 outline-none transition-colors duration-200 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* ==== FILTERS (Desktop) ==== */}
      <div className="mb-6 hidden space-y-2 md:block">{filterContent}</div>

      {/* ==== FILTERS (Mobile) ==== */}
      <div className="mb-6 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </span>
          <span className="text-[11px] text-zinc-600">
            {filters.platforms.size}/{ALL_PLATFORMS.length} platforms
          </span>
        </button>
        {mobileFiltersOpen && (
          <div className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            {filterContent}
          </div>
        )}
      </div>

      {/* ==== TASK LIST ==== */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TaskCardSkeleton key={i} index={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20">
            <Inbox className="mb-3 h-16 w-16 text-zinc-800" />
            <p className="text-sm text-zinc-600">
              No signals found for this filter
            </p>
            <button
              className="mt-3 text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-300"
              onClick={() =>
                setFilters({
                  platforms: new Set(ALL_PLATFORMS),
                  priorities: new Set(ALL_PRIORITIES),
                  statuses: new Set(ALL_STATUSES),
                  showReviewOnly: false,
                  search: "",
                })
              }
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              draggable
              onDragStartAction={handleDragStart}
              onDropAction={handleDrop}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-zinc-800/50 pt-4 text-center text-[11px] text-zinc-700">
        Nots.ai — Noise to Signal
      </div>

      {/* Global keyframe styles */}
      <style jsx global>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
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
