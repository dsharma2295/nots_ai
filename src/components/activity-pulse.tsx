"use client";

import { useRealtimeContext } from "@/components/providers/realtime-provider";
import type {
  ActivityEvent,
  ConnectionState,
  PulseState,
} from "@/hooks/use-realtime-refresh";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// Platform label mapping
// =============================================================

const PLATFORM_LABEL: Record<string, { label: string; dotColor: string }> = {
  SLACK: { label: "Slack", dotColor: "bg-[#E01E5A]" },
  GMAIL: { label: "Gmail", dotColor: "bg-[#EA4335]" },
  JIRA: { label: "Jira", dotColor: "bg-[#0052CC]" },
  TRELLO: { label: "Trello", dotColor: "bg-[#0079BF]" },
  ASANA: { label: "Asana", dotColor: "bg-[#F06A6A]" },
};

const EVENT_LABEL: Record<string, string> = {
  task_created: "New task",
  task_updated: "Task merged",
  task_deleted: "Task removed",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len) + "…" : s;
}

// =============================================================
// Status dot — breathing, spinning, or static
// =============================================================

function StatusDot({
  pulse,
  connection,
}: {
  pulse: PulseState;
  connection: ConnectionState;
}) {
  if (connection === "disconnected") {
    return <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />;
  }

  if (pulse === "processing") {
    return (
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-spin rounded-full border border-amber-400 border-t-transparent" />
      </span>
    );
  }

  if (pulse === "updated") {
    return (
      <motion.span
        className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"
        initial={{ scale: 1.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    );
  }

  // Idle — breathing dot
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-breathe" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </span>
  );
}

// =============================================================
// Activity dropdown — last 5 events
// =============================================================

function ActivityDropdown({
  events,
  open,
  onClose,
}: {
  events: ActivityEvent[];
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
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
              Recent Activity
            </span>
          </div>

          {/* Events */}
          {events.length === 0 ? (
            <div className="px-3.5 py-6 text-center">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                No activity yet
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto scrollbar-none">
              {events.slice(0, 5).map((evt, i) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-2.5 border-b border-zinc-50 px-3.5 py-2.5 last:border-0 dark:border-zinc-800/30"
                >
                  {/* Platform dot */}
                  <span
                    className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
                      evt.platform && PLATFORM_LABEL[evt.platform]
                        ? PLATFORM_LABEL[evt.platform].dotColor
                        : "bg-zinc-400"
                    }`}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      {EVENT_LABEL[evt.type] || "Activity"}
                      {evt.platform && PLATFORM_LABEL[evt.platform] && (
                        <span className="font-normal text-zinc-400 dark:text-zinc-500">
                          {" "}
                          from {PLATFORM_LABEL[evt.platform].label}
                        </span>
                      )}
                    </p>
                    {evt.taskTitle && (
                      <p className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                        {truncate(evt.taskTitle, 50)}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="shrink-0 text-[9px] tabular-nums text-zinc-300 dark:text-zinc-500">
                    {formatTime(evt.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================
// ACTIVITY PULSE — the main component
// =============================================================

export function ActivityPulse({
  intervalSeconds = 60,
}: {
  intervalSeconds?: number;
}) {
  const { connection, pulse, latestEvent, history } = useRealtimeContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  // Determine label text
  const labelText = (() => {
    if (connection === "disconnected") return "Offline";
    if (pulse === "processing") return "Processing";
    if (pulse === "updated") return "Updated";
    if (pulse === "activity" && latestEvent) {
      const platform =
        latestEvent.platform && PLATFORM_LABEL[latestEvent.platform];
      if (latestEvent.type === "task_created" && platform) {
        return `New from ${platform.label}`;
      }
      if (latestEvent.type === "task_updated") {
        return "Task merged";
      }
      return "Activity";
    }
    return "Live";
  })();

  // Color scheme based on state
  const colorScheme = (() => {
    if (connection === "disconnected") {
      return {
        bg: "bg-red-50 dark:bg-red-500/10",
        ring: "ring-red-200 dark:ring-red-500/20",
        text: "text-red-600 dark:text-red-400",
      };
    }
    if (pulse === "processing") {
      return {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        ring: "ring-amber-200 dark:ring-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
      };
    }
    if (pulse === "updated") {
      return {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        ring: "ring-emerald-300 dark:ring-emerald-400/30",
        text: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (pulse === "activity") {
      return {
        bg: "bg-indigo-50 dark:bg-indigo-500/10",
        ring: "ring-indigo-200 dark:ring-indigo-500/20",
        text: "text-indigo-600 dark:text-indigo-400",
      };
    }
    return {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      ring: "ring-emerald-200 dark:ring-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  })();

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
          dropdownOpen
            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        }`}
        title="Recent activity"
      >
        {/* Bell icon — animates when pulse is active */}
        <motion.div
          animate={
            pulse === "processing"
              ? { rotate: [0, -15, 15, -10, 10, 0] }
              : pulse === "updated"
                ? { scale: [1, 1.2, 1] }
                : {}
          }
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {connection === "disconnected" ? (
            <WifiOff className="h-4 w-4 text-red-400" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </motion.div>

        {/* Unread badge — shows count of unread events */}
        {history.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold leading-none text-white"
          >
            {history.length > 9 ? "9+" : history.length}
          </motion.span>
        )}

        {/* Processing pulse ring */}
        {pulse === "processing" && (
          <span className="absolute inset-0 rounded-lg ring-2 ring-indigo-400/50 dark:ring-indigo-500/40 animate-ping" />
        )}
      </button>

      <ActivityDropdown
        events={history}
        open={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
      />
    </div>
  );
}
