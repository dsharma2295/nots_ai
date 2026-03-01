"use client";

import { TaskCard } from "@/features/task-card/task-card";
import type { NodalTask } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import type { Flame } from "lucide-react";

export function KanbanColumn({
  title,
  icon: Icon,
  iconColor,
  accentColor = "bg-zinc-400",
  tasks,
  totalIndex,
  onTaskActionExec,
  recentArrivalIds,
  focusedCardId,
}: {
  title: string;
  icon: typeof Flame;
  iconColor: string;
  accentColor?: string;
  tasks: NodalTask[];
  totalIndex: number;
  onTaskActionExec: (
    taskId: string,
    action: string,
    value?: string,
  ) => Promise<void>;
  recentArrivalIds: Set<string>;
  focusedCardId: string | null;
}) {
  const sorted = [...tasks].sort((a, b) => {
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

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Column header — visually distinct from cards */}
      <div className="sticky top-0 z-10 mb-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          {/* Accent bar */}
          <div className={`h-5 w-1 rounded-full ${accentColor} opacity-80`} />
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {/* Count pill */}
          <span
            className={`ml-auto flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
              tasks.length > 0
                ? `${accentColor} bg-opacity-15 text-zinc-600 dark:text-zinc-300`
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={tasks.length}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="block"
              >
                {tasks.length}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        {/* Bottom rule */}
        <div
          className={`mt-1 h-px w-full ${tasks.length > 0 ? accentColor + " opacity-20" : "bg-zinc-200 dark:bg-zinc-800"}`}
        />
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800/40">
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No tasks
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {sorted.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  transition: { duration: 0.2, ease: "easeIn" },
                }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
              >
                <TaskCard
                  task={t}
                  index={0}
                  onTaskActionExec={onTaskActionExec}
                  isNewArrival={recentArrivalIds.has(t.id)}
                  isKeyboardFocused={focusedCardId === t.id}
                />{" "}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
