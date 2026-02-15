"use client";

import type {
  NodalTask,
  Platform,
  Priority,
  TaskStatus,
} from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { TaskCard } from "./task-card";

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

const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
const ALL_PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

const PLATFORM_META: Record<
  string,
  { label: string; color: string; activeColor: string }
> = {
  SLACK: {
    label: "Slack",
    color: "bg-purple-400/20 text-purple-400",
    activeColor: "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40",
  },
  GMAIL: {
    label: "Gmail",
    color: "bg-red-400/20 text-red-400",
    activeColor: "bg-red-500/20 text-red-300 ring-1 ring-red-500/40",
  },
  JIRA: {
    label: "Jira",
    color: "bg-blue-400/20 text-blue-400",
    activeColor: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40",
  },
  TRELLO: {
    label: "Trello",
    color: "bg-sky-400/20 text-sky-400",
    activeColor: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40",
  },
  ASANA: {
    label: "Asana",
    color: "bg-orange-400/20 text-orange-400",
    activeColor: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40",
  },
};

// =============================================================
// SIGNAL STREAM
// =============================================================

export function SignalStream({ tasks }: { tasks: NodalTask[] }) {
  const [filters, setFilters] = useState<Filters>({
    platforms: new Set(ALL_PLATFORMS),
    priorities: new Set(ALL_PRIORITIES),
    statuses: new Set(ALL_STATUSES),
    showReviewOnly: false,
    search: "",
  });

  const [sortBy, setSortBy] = useState<"updated" | "priority">("updated");

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

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

    return result;
  }, [tasks, filters, sortBy]);

  const reviewCount = tasks.filter((t) => t.needsReview).length;
  const totalSources = tasks.reduce((acc, t) => acc + t.sourceEvents.length, 0);

  return (
    <div className="mx-auto max-w-3xl">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <div className="mb-8">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-zinc-800 to-zinc-950 shadow-lg shadow-zinc-900/30">
            <span className="text-lg font-black tracking-tight text-white">
              N
            </span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
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

        {/* Stats bar */}
        <div className="mb-5 flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">{filtered.length}</span>
            <span className="text-zinc-600">tasks</span>
          </div>
          <div className="h-3 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">{totalSources}</span>
            <span className="text-zinc-600">sources</span>
          </div>
          {reviewCount > 0 && (
            <>
              <div className="h-3 w-px bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">{reviewCount}</span>
                <span className="text-zinc-600">need review</span>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700 focus:bg-zinc-900"
          />
        </div>
      </div>

      {/* ======================================================
          FILTERS
          ====================================================== */}
      <div className="mb-6 space-y-3">
        {/* Platform toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_PLATFORMS.map((p) => {
            const active = filters.platforms.has(p);
            const meta = PLATFORM_META[p];
            return (
              <button
                key={p}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    platforms: toggle(f.platforms, p),
                  }))
                }
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active ? meta.activeColor : "bg-zinc-800/50 text-zinc-600"
                }`}
              >
                {meta.label}
              </button>
            );
          })}

          <div className="mx-1 h-4 w-px bg-zinc-800" />

          {/* Sort */}
          <button
            onClick={() =>
              setSortBy(sortBy === "updated" ? "priority" : "updated")
            }
            className="rounded-lg bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300"
          >
            {sortBy === "updated" ? "↓ Latest" : "↓ Priority"}
          </button>

          {/* Review filter */}
          {reviewCount > 0 && (
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, showReviewOnly: !f.showReviewOnly }))
              }
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                filters.showReviewOnly
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-800/50 text-zinc-500"
              }`}
            >
              <span className="text-[10px]">⚠</span>
              Review ({reviewCount})
            </button>
          )}
        </div>

        {/* Priority toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_PRIORITIES.map((p) => {
            const active = filters.priorities.has(p);
            const colors: Record<string, string> = {
              CRITICAL: "bg-red-500/20 text-red-300 ring-1 ring-red-500/40",
              HIGH: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40",
              MEDIUM: "bg-zinc-500/20 text-zinc-300 ring-1 ring-zinc-500/40",
              LOW: "bg-zinc-600/20 text-zinc-400 ring-1 ring-zinc-600/40",
            };
            return (
              <button
                key={p}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    priorities: toggle(f.priorities, p),
                  }))
                }
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active ? colors[p] : "bg-zinc-800/50 text-zinc-600"
                }`}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}

          {/* Status toggles */}
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          {ALL_STATUSES.map((s) => {
            const active = filters.statuses.has(s);
            return (
              <button
                key={s}
                onClick={() =>
                  setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s) }))
                }
                className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                  active
                    ? "bg-zinc-700/50 text-zinc-300"
                    : "bg-zinc-800/50 text-zinc-600"
                }`}
              >
                {s.replace("_", " ").charAt(0) +
                  s.replace("_", " ").slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================
          TASK LIST
          ====================================================== */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <p className="text-sm text-zinc-600">No tasks match your filters</p>
            <button
              className="mt-3 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
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
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-zinc-800/50 pt-4 text-center text-[11px] text-zinc-700">
        Nots.ai — Noise to Signal
      </div>
    </div>
  );
}
