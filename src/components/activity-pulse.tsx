"use client";

import { useRealtimeContext } from "@/components/providers/realtime-provider";
import type { ActivityEvent } from "@/hooks/use-realtime-refresh";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Bell,
  Bookmark,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  WifiOff,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// Action → label + icon mapping
// =============================================================

const ACTION_CONFIG: Record<
  string,
  { label: string; Icon: typeof Bell; color: string }
> = {
  done: { label: "Marked done", Icon: CheckCircle2, color: "text-emerald-500" },
  trash: { label: "Moved to trash", Icon: Trash2, color: "text-red-400" },
  restore: { label: "Restored", Icon: RefreshCw, color: "text-blue-500" },
  bookmark: { label: "Bookmarked", Icon: Bookmark, color: "text-blue-500" },
  unbookmark: {
    label: "Bookmark removed",
    Icon: Bookmark,
    color: "text-zinc-400",
  },
  priority: { label: "Priority changed", Icon: Zap, color: "text-orange-500" },
  tier: { label: "Tier updated", Icon: Layers, color: "text-amber-500" },
  snooze: { label: "Snoozed", Icon: Archive, color: "text-zinc-400" },
  merge: { label: "Message merged", Icon: Zap, color: "text-indigo-500" },
  manual_create: {
    label: "Task created",
    Icon: Plus,
    color: "text-emerald-500",
  },
  task_created: {
    label: "New task arrived",
    Icon: Plus,
    color: "text-indigo-500",
  },
  task_deleted: { label: "Task removed", Icon: Trash2, color: "text-red-400" },
  task_updated: { label: "Task updated", Icon: Zap, color: "text-zinc-400" },
};

const PLATFORM_LABEL: Record<string, string> = {
  SLACK: "Slack",
  GMAIL: "Gmail",
  JIRA: "Jira",
  TRELLO: "Trello",
  ASANA: "Asana",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getConfig(evt: ActivityEvent) {
  // action takes priority over type for specific descriptions
  const key = evt.action ?? evt.type;
  return ACTION_CONFIG[key] ?? ACTION_CONFIG.task_updated;
}

// =============================================================
// DROPDOWN
// =============================================================

function ActivityDropdown({
  events,
  open,
  onClose,
  lastViewedAt,
}: {
  events: ActivityEvent[];
  open: boolean;
  onClose: () => void;
  lastViewedAt: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(
      () => document.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Header */}
          <div className="border-b border-zinc-100 px-3.5 py-2.5 dark:border-zinc-800/60">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Activity
            </span>
          </div>

          {events.length === 0 ? (
            <div className="px-3.5 py-6 text-center">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                No activity yet
              </p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto scrollbar-none">
              {events.map((evt) => {
                const isUnread = evt.timestamp > lastViewedAt;
                const cfg = getConfig(evt);
                const { Icon } = cfg;
                return (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-2.5 border-b border-zinc-50 px-3.5 py-2.5 last:border-0 dark:border-zinc-800/30 transition-colors ${
                      isUnread
                        ? "bg-indigo-50/60 dark:bg-indigo-500/[0.06]"
                        : ""
                    }`}
                  >
                    {/* Icon */}
                    <span
                      className={`mt-0.5 shrink-0 ${cfg.color} ${isUnread ? "" : "opacity-40"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-medium ${
                          isUnread
                            ? "text-zinc-800 dark:text-zinc-100"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {cfg.label}
                        {evt.platform && PLATFORM_LABEL[evt.platform] && (
                          <span
                            className={`font-normal ${isUnread ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-600"}`}
                          >
                            {" "}
                            via {PLATFORM_LABEL[evt.platform]}
                          </span>
                        )}
                      </p>
                      {evt.taskTitle && (
                        <p
                          className={`mt-0.5 truncate text-[10px] ${
                            isUnread
                              ? "text-zinc-500 dark:text-zinc-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        >
                          {evt.taskTitle}
                        </p>
                      )}
                    </div>

                    {/* Unread dot + time */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                      <span
                        className={`text-[9px] tabular-nums ${
                          isUnread
                            ? "text-zinc-400 dark:text-zinc-500"
                            : "text-zinc-300 dark:text-zinc-700"
                        }`}
                      >
                        {formatTime(evt.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================
// BELL BUTTON
// =============================================================

export function ActivityPulse() {
  const { connection, pulse, latestEvent, history } = useRealtimeContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastViewedAt, setLastViewedAt] = useState(() => Date.now());

  const unreadCount = history.filter((e) => e.timestamp > lastViewedAt).length;

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => {
      if (!prev) {
        // Mark all as read when opening
        setLastViewedAt(Date.now());
      }
      return !prev;
    });
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
          dropdownOpen
            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            : unreadCount > 0
              ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        }`}
        title="Activity"
      >
        {/* Bell — animates on new activity */}
        <motion.div
          animate={
            pulse === "processing"
              ? { rotate: [0, -12, 12, -8, 8, 0] }
              : pulse === "updated"
                ? { scale: [1, 1.2, 1] }
                : {}
          }
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          {connection === "disconnected" ? (
            <WifiOff className="h-4 w-4 text-red-400" />
          ) : (
            <Bell
              className={`h-4 w-4 transition-all ${unreadCount > 0 && !dropdownOpen ? "" : ""}`}
            />
          )}
        </motion.div>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && !dropdownOpen && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-500 px-0.5 text-[8px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Processing ring */}
        {pulse === "processing" && (
          <span className="absolute inset-0 rounded-lg ring-2 ring-indigo-400/40 dark:ring-indigo-500/30" />
        )}
      </button>

      <ActivityDropdown
        events={history}
        open={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
        lastViewedAt={lastViewedAt}
      />
    </div>
  );
}
