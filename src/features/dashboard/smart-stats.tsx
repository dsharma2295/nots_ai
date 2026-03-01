"use client";

import type { NodalTask } from "@/types";
import { Plus } from "lucide-react";

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
  // Tasks completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tasks completed yesterday (for delta)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const openCount = tasks.filter(
    (t) =>
      t.status === "OPEN" ||
      t.status === "IN_PROGRESS" ||
      t.status === "BLOCKED",
  ).length;

  const criticalCount = tasks.filter(
    (t) =>
      t.priority === "CRITICAL" &&
      t.status !== "DONE" &&
      t.status !== "TRASHED",
  ).length;

  return (
    <div className="mb-4 flex items-center gap-2">
      {/* Open tasks count — quick orientation */}
      <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100/80 px-2.5 py-1.5 dark:bg-zinc-800/50">
        <span className="text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
          {openCount}
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          open
        </span>
      </div>

      {/* Critical count — only when non-zero */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 dark:bg-red-500/10">
          <span className="text-[12px] font-semibold tabular-nums text-red-600 dark:text-red-400">
            {criticalCount}
          </span>
          <span className="text-[11px] text-red-500/70 dark:text-red-400/70">
            critical
          </span>
        </div>
      )}

      {/* Quick-add button */}
      <button
        onClick={onQuickAdd}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.97] dark:border-zinc-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
      >
        <Plus className="h-3 w-3" />
        Add task
      </button>
    </div>
  );
}
