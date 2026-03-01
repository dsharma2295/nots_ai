"use client";

import type { NodalTask } from "@/types";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

// =============================================================
// Priority segments — matches kanban column colours exactly
// =============================================================

const SEGMENTS = [
  {
    key: "urgent",
    label: "Urgent",
    priorities: ["CRITICAL", "HIGH"],
    bar: "bg-orange-400 dark:bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-400",
  },
  {
    key: "normal",
    label: "Normal",
    priorities: ["MEDIUM"],
    bar: "bg-blue-400 dark:bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-400",
  },
  {
    key: "low",
    label: "Low",
    priorities: ["LOW"],
    bar: "bg-zinc-300 dark:bg-zinc-600",
    text: "text-zinc-500 dark:text-zinc-400",
    dot: "bg-zinc-300 dark:bg-zinc-500",
  },
] as const;

export function SmartStats({
  tasks,
  onQuickAdd,
}: {
  tasks: NodalTask[];
  trashedCount?: number;
  onOpenResolved?: () => void;
  onOpenTrash?: () => void;
  onQuickAdd?: () => void;
}) {
  const open = tasks.filter(
    (t) =>
      t.status === "OPEN" ||
      t.status === "IN_PROGRESS" ||
      t.status === "BLOCKED",
  );

  const total = open.length;

  const counts = SEGMENTS.map((seg) => ({
    ...seg,
    count: open.filter((t) =>
      (seg.priorities as readonly string[]).includes(t.priority),
    ).length,
  }));

  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
    <div className="mb-4">
      {/* Row: count + legend + add button */}
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-100">
            {total}
          </span>
          <span className="text-[12px] text-zinc-400 dark:text-zinc-500">
            open task{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Per-priority counts — only show non-zero */}
        <div className="flex items-center gap-3 ml-1">
          {counts
            .filter((s) => s.count > 0)
            .map((seg) => (
              <span key={seg.key} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${seg.dot}`} />
                <span
                  className={`text-[11px] font-semibold tabular-nums ${seg.text}`}
                >
                  {seg.count}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {seg.label}
                </span>
              </span>
            ))}
        </div>

        <button
          onClick={onQuickAdd}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.97] dark:border-zinc-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
        >
          <Plus className="h-3 w-3" />
          Add task
        </button>
      </div>

      {/* Segmented progress bar */}
      {total > 0 ? (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {counts.map((seg, i) => {
            if (seg.count === 0) return null;
            return (
              <motion.div
                key={seg.key}
                className={`h-full ${seg.bar} ${i > 0 ? "ml-px" : ""}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct(seg.count)}%` }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
      )}
    </div>
  );
}
