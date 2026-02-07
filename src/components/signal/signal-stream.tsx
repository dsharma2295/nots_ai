"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
}

const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
const ALL_PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

const PLATFORM_COLORS: Record<string, string> = {
  SLACK: "bg-purple-500",
  GMAIL: "bg-red-500",
  JIRA: "bg-blue-500",
  TRELLO: "bg-sky-500",
  ASANA: "bg-orange-500",
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
  });

  const [sortBy, setSortBy] = useState<"updated" | "priority">("updated");

  // Toggle a value in a Set filter
  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  // Apply filters
  const filtered = useMemo(() => {
    const result = tasks.filter((t) => {
      // Platform filter: task must have at least one event from a selected platform
      const taskPlatforms = new Set(t.sourceEvents.map((e) => e.platform));
      const hasPlatform = [...taskPlatforms].some((p) =>
        filters.platforms.has(p),
      );
      if (!hasPlatform) return false;

      if (!filters.priorities.has(t.priority)) return false;
      if (!filters.statuses.has(t.status)) return false;
      if (filters.showReviewOnly && !t.needsReview) return false;

      return true;
    });

    // Sort
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

  // Counts for filter badges
  const reviewCount = tasks.filter((t) => t.needsReview).length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            N
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Command Center
            </h1>
            <p className="text-sm text-zinc-500">
              {filtered.length} task{filtered.length !== 1 ? "s" : ""} ·{" "}
              {tasks.reduce((acc, t) => acc + t.sourceEvents.length, 0)} sources
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTROL BAR
          ====================================================== */}
      <div className="mb-6 space-y-3">
        {/* Platform toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Platforms
          </span>
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
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border-zinc-300 bg-white text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    : "border-transparent bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${PLATFORM_COLORS[p]} ${active ? "" : "opacity-30"}`}
                />
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Priority + Status + Sort + Review */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Priority
          </span>
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
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "border-zinc-300 bg-white text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    : "border-transparent bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
                }`}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}

          <span className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Sort toggle */}
          <button
            onClick={() =>
              setSortBy(sortBy === "updated" ? "priority" : "updated")
            }
            className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 transition-all hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          >
            Sort: {sortBy === "updated" ? "Latest" : "Priority"}
          </button>

          {/* Review filter */}
          {reviewCount > 0 && (
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, showReviewOnly: !f.showReviewOnly }))
              }
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                filters.showReviewOnly
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              ⚠ Review
              <Badge
                variant="secondary"
                className="h-4 min-w-4 rounded-full px-1 text-[10px]"
              >
                {reviewCount}
              </Badge>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          TASK LIST
          ====================================================== */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-400">
              No tasks match your filters.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={() =>
                setFilters({
                  platforms: new Set(ALL_PLATFORMS),
                  priorities: new Set(ALL_PRIORITIES),
                  statuses: new Set(ALL_STATUSES),
                  showReviewOnly: false,
                })
              }
            >
              Reset filters
            </Button>
          </div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
