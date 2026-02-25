"use client";

import type { NodalTask } from "@/lib/mock-data";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  Bookmark,
  Flame,
  Minus,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";

// Isolated animated counter — renders the number with a vertical
// flip when the value changes. Extracted to avoid re-rendering siblings.
function AnimatedCount({
  count,
  className,
}: {
  count: number;
  className: string;
}) {
  return (
    <span className="inline-flex overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={count}
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`block tabular-nums ${className}`}
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SmartStats({
  tasks,
  trashedCount,
  onOpenResolved,
  onOpenTrash,
}: {
  tasks: NodalTask[];
  trashedCount: number;
  onOpenResolved: () => void;
  onOpenTrash: () => void;
}) {
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
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${item.bg}`}
          >
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            <AnimatedCount count={item.count} className={item.color} />
            <span className="text-zinc-500">{item.label}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/bookmarks"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-all hover:text-blue-500 active:scale-95 dark:text-zinc-500 dark:hover:text-blue-400"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Bookmarks
        </Link>
        <button
          onClick={onOpenTrash}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-all hover:text-red-500 active:scale-95 dark:text-zinc-500 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Trash
          {trashedCount > 0 && (
            <span className="inline-flex overflow-hidden rounded-full bg-red-50 px-1.5 py-0.5 dark:bg-red-500/10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={trashedCount}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="block text-[10px] font-medium tabular-nums text-red-500 dark:text-red-400"
                >
                  {trashedCount}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </button>
        <button
          onClick={onOpenResolved}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 transition-all hover:text-indigo-500 active:scale-95 dark:text-zinc-500 dark:hover:text-indigo-400"
        >
          <Archive className="h-3.5 w-3.5" />
          View resolved
        </button>
      </div>
    </div>
  );
}
