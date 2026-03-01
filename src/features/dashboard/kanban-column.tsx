"use client";

import { TaskCard } from "@/features/task-card/task-card";
import type { NodalTask } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import type { Flame } from "lucide-react";

export function KanbanColumn({
  title,
  icon: Icon,
  iconColor,
  tasks,
  totalIndex,
  onTaskActionExec,
  recentArrivalIds,
  focusedCardId,
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
      {/* Column header — white card, same surface as task cards, distinguished by dot color + stronger type */}
      <div className="sticky top-0 z-10 mb-3 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
        <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </span>
        <span className="ml-auto flex items-center justify-center overflow-hidden rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={tasks.length}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="block text-[11px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400"
            >
              {tasks.length}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      {/* Cards */}
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
