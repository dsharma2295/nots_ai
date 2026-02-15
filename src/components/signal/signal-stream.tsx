"use client";

import { useCmdK, useCountUp } from "@/lib/hooks";
import type {
  NodalTask,
  Platform,
  Priority,
  TaskStatus,
} from "@/lib/mock-data";
import {
  AlertTriangle,
  Inbox,
  Layers,
  Radio,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { TaskCard } from "./task-card";
import { TaskCardSkeleton } from "./task-card-skeleton";

const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
const ALL_PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

const PLAT_STYLE: Record<string, { active: string; icon: string }> = {
  SLACK: {
    active: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/25",
    icon: "#",
  },
  GMAIL: {
    active: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
    icon: "✉",
  },
  JIRA: {
    active: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25",
    icon: "◆",
  },
  TRELLO: {
    active: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
    icon: "▦",
  },
  ASANA: {
    active: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25",
    icon: "◎",
  },
};

const PRI_STYLE: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  HIGH: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25",
  MEDIUM: "bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-600/25",
  LOW: "bg-zinc-800/50 text-zinc-500 ring-1 ring-zinc-700/25",
};

interface Filters {
  platforms: Set<Platform>;
  priorities: Set<Priority>;
  statuses: Set<TaskStatus>;
  showReviewOnly: boolean;
  search: string;
}

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
  const [mobileOpen, setMobileOpen] = useState(false);

  function tog<T>(set: Set<T>, val: T): Set<T> {
    const n = new Set(set);
    if (n.has(val)) n.delete(val);
    else n.add(val);
    return n;
  }

  const filtered = useMemo(() => {
    const result = tasks.filter((t) => {
      const tp = new Set(t.sourceEvents.map((e) => e.platform));
      if (![...tp].some((p) => filters.platforms.has(p))) return false;
      if (!filters.priorities.has(t.priority)) return false;
      if (!filters.statuses.has(t.status)) return false;
      if (filters.showReviewOnly && !t.needsReview) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });

    if (sortBy === "updated") {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    } else {
      const o: Record<Priority, number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };
      result.sort((a, b) => o[a.priority] - o[b.priority]);
    }

    return result;
  }, [tasks, filters, sortBy]);

  const reviewCount = tasks.filter((t) => t.needsReview).length;
  const totalSources = tasks.reduce((acc, t) => acc + t.sourceEvents.length, 0);
  const aTasks = useCountUp(filtered.length);
  const aSources = useCountUp(totalSources);

  const pill = (
    active: boolean,
    activeStyle: string,
    label: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200 active:scale-[0.97] ${
        active
          ? activeStyle
          : "bg-transparent text-zinc-600 ring-1 ring-zinc-800 hover:text-zinc-400 hover:ring-zinc-700"
      }`}
    >
      {label}
    </button>
  );

  const filterBar = (
    <div className="space-y-3">
      {/* Platforms */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_PLATFORMS.map((p) =>
          pill(
            filters.platforms.has(p),
            PLAT_STYLE[p].active,
            p.charAt(0) + p.slice(1).toLowerCase(),
            () => setFilters((f) => ({ ...f, platforms: tog(f.platforms, p) })),
          ),
        )}
      </div>
      {/* Priority + Status */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ALL_PRIORITIES.map((p) =>
          pill(
            filters.priorities.has(p),
            PRI_STYLE[p],
            p === "CRITICAL"
              ? "P0"
              : p === "HIGH"
                ? "P1"
                : p === "MEDIUM"
                  ? "P2"
                  : "P3",
            () =>
              setFilters((f) => ({ ...f, priorities: tog(f.priorities, p) })),
          ),
        )}
        <div className="mx-0.5 h-4 w-px bg-zinc-800" />
        {ALL_STATUSES.map((s) => {
          const label =
            s === "IN_PROGRESS"
              ? "Active"
              : s.charAt(0) + s.slice(1).toLowerCase();
          return pill(
            filters.statuses.has(s),
            "bg-zinc-700/30 text-zinc-300 ring-1 ring-zinc-600/30",
            label,
            () => setFilters((f) => ({ ...f, statuses: tog(f.statuses, s) })),
          );
        })}
        <div className="mx-0.5 h-4 w-px bg-zinc-800" />
        <button
          onClick={() =>
            setSortBy((s) => (s === "updated" ? "priority" : "updated"))
          }
          className="rounded-lg px-2.5 py-1 text-[11px] text-zinc-500 ring-1 ring-zinc-800 transition-all hover:text-zinc-300 active:scale-[0.97]"
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
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
              filters.showReviewOnly
                ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"
                : "text-zinc-500 ring-1 ring-zinc-800 hover:text-amber-400"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {reviewCount}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 flex items-center gap-5 text-[13px]">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-zinc-600" />
          <span className="font-semibold tabular-nums text-zinc-100">
            {aTasks}
          </span>
          <span className="text-zinc-600">tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-zinc-600" />
          <span className="font-semibold tabular-nums text-zinc-100">
            {aSources}
          </span>
          <span className="text-zinc-600">sources</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search tasks...  ⌘K"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="h-10 w-full rounded-xl border border-zinc-800/80 bg-zinc-900/50 pl-10 pr-4 text-sm text-zinc-100 shadow-inner shadow-black/20 placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/30 focus:shadow-[0_0_15px_rgba(99,102,241,0.06)]"
        />
      </div>

      {/* Filters — Desktop */}
      <div className="mb-6 hidden md:block">{filterBar}</div>

      {/* Filters — Mobile */}
      <div className="mb-6 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-400"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </span>
          <span className="text-[11px] text-zinc-600">
            {filters.platforms.size}/{ALL_PLATFORMS.length}
          </span>
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 backdrop-blur-sm">
            {filterBar}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TaskCardSkeleton key={i} index={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/60 py-20">
            <Inbox className="mb-3 h-12 w-12 text-zinc-800" />
            <p className="text-sm text-zinc-600">No signals found</p>
            <button
              className="mt-3 text-[11px] text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
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
              Reset filters
            </button>
          </div>
        ) : (
          filtered.map((t, i) => <TaskCard key={t.id} task={t} index={i} />)
        )}
      </div>

      {/* Footer */}
      <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-zinc-700">
        <span className="h-px w-8 bg-zinc-800" />
        Noise → Signal
        <span className="h-px w-8 bg-zinc-800" />
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
