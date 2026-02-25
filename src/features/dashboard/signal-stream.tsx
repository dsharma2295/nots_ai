"use client";
import { useToast } from "@/components/toast";
import { AIResponseCard, AIResponseLoading } from "@/features/ai/ai-response";
import { ResolvedDrawer } from "@/features/drawers/resolved-drawer";
import { TrashDrawer } from "@/features/drawers/trash-drawer";
import { useKeyboardNav } from "@/features/keyboard/hooks/use-keyboard-nav";
import { ShortcutOverlay } from "@/features/keyboard/shortcut-overlay";
import { TaskCardSkeleton } from "@/features/task-card/task-card-skeleton";
import { useCmdK } from "@/hooks";
import type { Platform } from "@/lib/mock-data";
import { useRealtimeContext } from "@/lib/realtime-provider";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import type { NodalTask } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  Inbox,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_PLATFORMS,
  ALL_STATUSES,
  INTENT_GROUPS,
  matchIntentGroup,
  type Filters,
  type IntentGroup,
} from "./helpers";
import { KanbanColumn } from "./kanban-column";
import { MiniCalendar } from "./mini-calendar";
import { SmartStats } from "./smart-stats";

// =============================================================
// PLATFORM FILTER PILL — frosted glass container, raised active button
// Inspired by the physical segmented control in the design reference.
// Active platform: elevated glossy button with amber/gold ring.
// Inactive: flat icon, muted color.
// =============================================================

// =============================================================
// PLATFORM BRAND SVG ICONS
// Inline paths sourced from Bootstrap Icons (Slack, Trello),
// Simple Icons (Gmail, Jira, Asana) — no CDN dependency.
// viewBox 0 0 16 16 for Slack/Trello, 0 0 24 24 for others.
// =============================================================

function SlackIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M3.362 10.11c0 .926-.756 1.681-1.681 1.681S0 11.036 0 10.111.756 8.43 1.68 8.43h1.682zm.846 0c0-.924.756-1.68 1.681-1.68s1.681.756 1.681 1.68v4.21c0 .924-.756 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68zM5.89 3.362c-.926 0-1.682-.756-1.682-1.681S4.964 0 5.89 0s1.68.756 1.68 1.68v1.682zm0 .846c.924 0 1.68.756 1.68 1.681S6.814 7.57 5.89 7.57H1.68C.757 7.57 0 6.814 0 5.89c0-.926.756-1.682 1.68-1.682zm6.749 1.682c0-.926.755-1.682 1.68-1.682S16 4.964 16 5.889s-.756 1.681-1.68 1.681h-1.681zm-.848 0c0 .924-.755 1.68-1.68 1.68A1.685 1.685 0 0 1 8.43 5.89V1.68C8.43.757 9.186 0 10.11 0c.926 0 1.681.756 1.681 1.68zm-1.681 6.748c.926 0 1.682.756 1.682 1.681S11.036 16 10.11 16s-1.681-.756-1.681-1.68v-1.682h1.68zm0-.847c-.924 0-1.68-.755-1.68-1.68s.756-1.681 1.68-1.681h4.21c.924 0 1.68.756 1.68 1.68 0 .926-.756 1.681-1.68 1.681z" />
    </svg>
  );
}

function GmailIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.907 1.528-1.148C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

function JiraIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.021-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.214 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z" />
    </svg>
  );
}

function TrelloIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M14.1 0H1.903C.852 0 .002.85 0 1.9v12.19A1.9 1.9 0 0 0 1.902 16h12.199A1.9 1.9 0 0 0 16 14.09V1.9A1.9 1.9 0 0 0 14.1 0zM7 11.367a.636.636 0 0 1-.64.633H3.593a.633.633 0 0 1-.63-.633V3.583c0-.348.281-.631.63-.633h2.765c.35.002.632.284.633.633zm6.052-3.5a.633.633 0 0 1-.64.633h-2.78A.636.636 0 0 1 9 7.867V3.583a.636.636 0 0 1 .633-.633h2.778c.35.002.631.285.631.633z" />
    </svg>
  );
}

function AsanaIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 19.5a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5zm-5.917-8.25a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5zm11.834 0a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5z" />
    </svg>
  );
}

// Brand colors — active state icon color, tinted chip bg
const PLATFORM_CONFIG: Record<
  string,
  {
    label: string;
    Icon: (props: {
      className?: string;
      style?: React.CSSProperties;
    }) => React.ReactElement;
    brand: string; // active icon color
    chipBg: string; // active chip background
    chipBgDark: string;
    inactiveIcon: string;
  }
> = {
  SLACK: {
    label: "Slack",
    Icon: SlackIcon,
    brand: "#4A154B",
    chipBg: "rgba(74,21,75,0.08)",
    chipBgDark: "rgba(155,89,165,0.12)",
    inactiveIcon: "rgba(74,21,75,0.3)",
  },
  GMAIL: {
    label: "Gmail",
    Icon: GmailIcon,
    brand: "#EA4335",
    chipBg: "rgba(234,67,53,0.08)",
    chipBgDark: "rgba(234,67,53,0.12)",
    inactiveIcon: "rgba(234,67,53,0.3)",
  },
  JIRA: {
    label: "Jira",
    Icon: JiraIcon,
    brand: "#0052CC",
    chipBg: "rgba(0,82,204,0.08)",
    chipBgDark: "rgba(76,154,255,0.12)",
    inactiveIcon: "rgba(0,82,204,0.3)",
  },
  TRELLO: {
    label: "Trello",
    Icon: TrelloIcon,
    brand: "#0079BF",
    chipBg: "rgba(0,121,191,0.08)",
    chipBgDark: "rgba(0,194,224,0.12)",
    inactiveIcon: "rgba(0,121,191,0.3)",
  },
  ASANA: {
    label: "Asana",
    Icon: AsanaIcon,
    brand: "#F06A6A",
    chipBg: "rgba(240,106,106,0.08)",
    chipBgDark: "rgba(240,106,106,0.12)",
    inactiveIcon: "rgba(240,106,106,0.3)",
  },
};

// Detect dark mode for inline style switching
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// =============================================================
// PLATFORM FILTER PILL
// iOS-style segmented control: single pill container,
// each platform chip shows its real brand icon.
// Active: white chip (light) / zinc-800 chip (dark) + brand-colored icon + soft shadow.
// Inactive: muted brand icon, transparent bg.
// Tooltip on hover shows platform name.
// =============================================================

function PlatformFilterPill({
  platforms,
  spotlight,
  hasData,
  onToggle,
}: {
  platforms: string[];
  spotlight: Set<string>;
  hasData: Set<string>;
  onToggle: (p: string) => void;
}) {
  const isDark = useIsDark();
  const anySpotlit = spotlight.size > 0;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-100/60 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
      {platforms.map((p) => {
        const cfg = PLATFORM_CONFIG[p];
        if (!cfg) return null;
        const { Icon, label, brand, chipBg, chipBgDark, inactiveIcon } = cfg;
        const isSpotlit = spotlight.has(p);
        const hasTaskData = hasData.has(p);

        // Three visual states:
        // 1. Spotlit — brand color + raised white chip
        // 2. Has data + not spotlit + no spotlight active — muted brand color
        // 3. Has data + not spotlit + spotlight active — even more muted (de-emphasised)
        // 4. No data — fully grey, no interaction
        const isDisabled = !hasTaskData;
        const opacity = isDisabled
          ? 0.25
          : isSpotlit
            ? 1
            : anySpotlit
              ? 0.35
              : 0.6;

        return (
          <motion.button
            key={p}
            onClick={() => !isDisabled && onToggle(p)}
            title={`${label}${isDisabled ? " (no tasks)" : ""}`}
            animate={{ opacity, scale: isSpotlit ? 1 : 0.95 }}
            transition={{ duration: 0.15 }}
            disabled={isDisabled}
            className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{
              cursor: isDisabled ? "default" : "pointer",
              background: isSpotlit
                ? isDark
                  ? chipBgDark
                  : "rgba(255,255,255,0.95)"
                : "transparent",
              boxShadow: isSpotlit
                ? isDark
                  ? "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 1px 3px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)"
                : "none",
            }}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={{
                color: isDisabled
                  ? isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)"
                  : isSpotlit
                    ? brand
                    : isDark
                      ? inactiveIcon.replace("0.3", "0.5")
                      : inactiveIcon,
              }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export function SignalStream({
  tasks: serverTasks,
  resolvedTasks = [],
  trashedTasks = [],
  isLoading = false,
}: {
  tasks: NodalTask[];
  resolvedTasks?: NodalTask[];
  trashedTasks?: NodalTask[];
  isLoading?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useCmdK(searchRef);
  const { recentArrivalIds } = useRealtimeContext();
  // Local task state for optimistic updates (done removal, priority, tier)
  const { toast } = useToast();
  const [localTasks, setLocalTasks] = useState(serverTasks);
  const [localResolvedTasks, setLocalResolvedTasks] = useState(resolvedTasks);
  const [localTrashedTasks, setLocalTrashedTasks] = useState(trashedTasks);
  const pendingRef = useRef<Set<string>>(new Set());
  const prevRef = useRef(serverTasks);
  const prevResolvedRef = useRef(resolvedTasks);
  const prevTrashedRef = useRef(trashedTasks);
  if (prevRef.current !== serverTasks) {
    prevRef.current = serverTasks;
    setLocalTasks((current) =>
      serverTasks.map((serverTask) => {
        if (pendingRef.current.has(serverTask.id)) {
          const localVersion = current.find((t) => t.id === serverTask.id);
          return localVersion ?? serverTask;
        }
        return serverTask;
      }),
    );
  }
  if (prevResolvedRef.current !== resolvedTasks) {
    prevResolvedRef.current = resolvedTasks;
    setLocalResolvedTasks(resolvedTasks);
  }
  if (prevTrashedRef.current !== trashedTasks) {
    prevTrashedRef.current = trashedTasks;
    setLocalTrashedTasks(trashedTasks);
  }
  const [filters, setFilters] = useState<Filters>({
    platforms: new Set(ALL_PLATFORMS),
    statuses: new Set(ALL_STATUSES),
    showReviewOnly: false,
    spotlightPlatforms: new Set<(typeof ALL_PLATFORMS)[number]>(),
    intentGroup: "all",
    search: "",
    selectedDate: null,
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  // AI mode state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResponse | null>(null);

  const isAiMode = filters.search.startsWith("/");
  const filterText = isAiMode ? "" : filters.search;

  // Execute AI query
  const executeAiQuery = useCallback(async (query: string) => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.slice(1).trim() }),
      });
      const data = await res.json();
      if (data.text) {
        setAiResponse(data as AIQueryResponse);
      }
    } catch (err) {
      console.error("[AI Query] Failed:", err);
      setAiResponse({
        text: "Something went wrong. Please try again.",
        actions: [],
        queryType: "summary",
        referencedTaskIds: [],
      });
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Execute AI action
  const executeAiAction = useCallback(
    async (action: AIQueryResponse["actions"][number]) => {
      const body =
        action.type === "createTask"
          ? {
              action: "createTask",
              title: action.title,
              intent: action.intent,
              priority: action.priority,
            }
          : action.type === "updateStatus"
            ? {
                action: "updateStatus",
                taskId: action.taskId,
                status: action.status,
              }
            : action.type === "updatePriority"
              ? {
                  action: "updatePriority",
                  taskId: action.taskId,
                  priority: action.priority,
                }
              : action.type === "snoozeTask"
                ? {
                    action: "snooze",
                    taskId: action.taskId,
                    snoozeUntil: action.until,
                  }
                : null;

      if (!body) return;

      const res = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Action failed");
    },
    [],
  );

  // Execute task card actions — with optimistic updates + pending guard
  const executeTaskAction = useCallback(
    async (taskId: string, action: string, value?: string) => {
      pendingRef.current.add(taskId);

      // Snapshot the task BEFORE any optimistic update so Undo can restore it.
      // We read from the functional updater pattern below, but for "done" and
      // "delete" we need the snapshot here synchronously.
      let snapshotTask: NodalTask | undefined;
      if (action === "done" || action === "delete") {
        // Use a ref-style read: localTasks state is captured via closure at
        // callback creation time, which is accurate enough for this purpose.
        snapshotTask = localTasks.find((t) => t.id === taskId);
      }

      // Optimistic update
      if (action === "done") {
        setLocalTasks((prev) => {
          const doneTask = prev.find((t) => t.id === taskId);
          if (doneTask) {
            setLocalResolvedTasks((resolved) => [
              { ...doneTask, status: "DONE" as NodalTask["status"] },
              ...resolved,
            ]);
          }
          return prev.map((t) =>
            t.id === taskId
              ? { ...t, status: "DONE" as NodalTask["status"] }
              : t,
          );
        });
      } else if (action === "priority" && value) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, priority: value as NodalTask["priority"] }
              : t,
          ),
        );
      } else if (action === "tier" && value) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, tier: parseInt(value, 10) } : t,
          ),
        );
      } else if (action === "bookmark") {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, bookmarked: !t.bookmarked } : t,
          ),
        );
      } else if (action === "markSeen" && value) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, seenEventCount: parseInt(value, 10) } : t,
          ),
        );
      } else if (action === "noteCount" && value) {
        const count = parseInt(value, 10);
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, noteCount: count } : t)),
        );
        setLocalResolvedTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, noteCount: count } : t)),
        );
        setLocalTrashedTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, noteCount: count } : t)),
        );
      } else if (action === "delete") {
        setLocalTasks((prev) => {
          const deletedTask = prev.find((t) => t.id === taskId);
          if (deletedTask) {
            setLocalTrashedTasks((trashed) => [
              {
                ...deletedTask,
                status: "TRASHED" as NodalTask["status"],
                trashedAt: new Date().toISOString(),
              },
              ...trashed,
            ]);
          }
          return prev.filter((t) => t.id !== taskId);
        });
      } else if (action === "confirmDelete") {
        // Dispatched by T key via keyboard nav.
        // TaskCard listens for this event to show its confirm modal.
        // No optimistic update — wait for user to confirm in the modal.
        window.dispatchEvent(
          new CustomEvent("nots:confirmDelete", { detail: { taskId } }),
        );
        pendingRef.current.delete(taskId);
        return;
      }

      const body =
        action === "done"
          ? { action: "updateStatus", taskId, status: "DONE" }
          : action === "priority" && value
            ? { action: "updatePriority", taskId, priority: value }
            : action === "tier" && value
              ? { action: "updateTier", taskId, tier: parseInt(value, 10) }
              : action === "bookmark"
                ? { action: "bookmark", taskId }
                : action === "markSeen" && value
                  ? {
                      action: "markSeen",
                      taskId,
                      seenEventCount: parseInt(value, 10),
                    }
                  : action === "delete"
                    ? { action: "deleteTask", taskId }
                    : null;
      // confirmDelete is handled above and returns early — never reaches here.
      if (!body) {
        pendingRef.current.delete(taskId);
        return;
      }

      try {
        const res = await fetch("/api/tasks/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          toast("Action failed — try again", "error");
        } else if (action === "done") {
          // Undo: restore task back to OPEN
          toast("Task resolved", undefined, {
            undo: snapshotTask
              ? {
                  label: "Undo",
                  action: () => {
                    setLocalTasks((prev) => [
                      {
                        ...snapshotTask!,
                        status: "OPEN" as NodalTask["status"],
                      },
                      ...prev.filter((t) => t.id !== taskId),
                    ]);
                    setLocalResolvedTasks((prev) =>
                      prev.filter((t) => t.id !== taskId),
                    );
                    fetch("/api/tasks/update", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "updateStatus",
                        taskId,
                        status: "OPEN",
                      }),
                    });
                  },
                }
              : undefined,
          });
        } else if (action === "priority" && value) {
          toast(
            "Moved to " +
              (value === "CRITICAL" || value === "HIGH"
                ? "Urgent"
                : value === "MEDIUM"
                  ? "Normal"
                  : "Low Priority"),
          );
        } else if (action === "tier" && value) {
          toast(
            parseInt(value, 10) === 0 ? "Priority cleared" : `Set to P${value}`,
          );
        } else if (action === "bookmark") {
          toast("Bookmark updated");
        } else if (action === "delete") {
          // Undo: restore task back from trash
          toast("Moved to trash", undefined, {
            undo: snapshotTask
              ? {
                  label: "Undo",
                  action: () => {
                    setLocalTasks((prev) => [
                      {
                        ...snapshotTask!,
                        status: "OPEN" as NodalTask["status"],
                        trashedAt: null,
                      },
                      ...prev,
                    ]);
                    setLocalTrashedTasks((prev) =>
                      prev.filter((t) => t.id !== taskId),
                    );
                    fetch("/api/tasks/update", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "updateStatus",
                        taskId,
                        status: "OPEN",
                      }),
                    });
                  },
                }
              : undefined,
          });
        }
      } finally {
        setTimeout(() => {
          pendingRef.current.delete(taskId);
        }, 16000);
      }
    },
    [toast, localTasks],
  );

  // Handle search
  function handleSearchChange(value: string) {
    setFilters((f) => ({ ...f, search: value }));
    if (!value) {
      setAiResponse(null);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isAiMode && filters.search.length > 1) {
      e.preventDefault();
      executeAiQuery(filters.search);
    }
    if (e.key === "Escape") {
      setAiResponse(null);
      setFilters((f) => ({ ...f, search: "" }));
      searchRef.current?.blur();
    }
  }

  // Filtered tasks — use localTasks for optimistic updates
  const filtered = useMemo(() => {
    return localTasks.filter((t) => {
      if (
        t.status === "DONE" ||
        t.status === "ARCHIVED" ||
        t.status === "TRASHED"
      )
        return false;

      // Platform spotlight: if any platforms are spotlighted,
      // only show tasks that have at least one source event from
      // one of the spotlighted platforms.
      if (filters.spotlightPlatforms.size > 0) {
        const taskPlatforms = new Set(t.sourceEvents.map((e) => e.platform));
        if (![...filters.spotlightPlatforms].some((p) => taskPlatforms.has(p)))
          return false;
      }

      // Intent group filter
      if (filters.intentGroup !== "all") {
        if (!matchIntentGroup(t.intent, filters.intentGroup)) return false;
      }

      if (filterText) {
        const q = filterText.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.selectedDate) {
        const td = new Date(t.updatedAt);
        const ds = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
        if (ds !== filters.selectedDate) return false;
      }
      return true;
    });
  }, [localTasks, filters, filterText]);

  const urgent = filtered.filter(
    (t) => t.priority === "CRITICAL" || t.priority === "HIGH",
  );
  const active = filtered.filter((t) => t.priority === "MEDIUM");
  const low = filtered.filter((t) => t.priority === "LOW");

  // Sort helper — must match KanbanColumn's internal sort exactly
  const sortCards = useCallback((cards: NodalTask[]) => {
    return [...cards].sort((a, b) => {
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
  }, []);

  const keyboardColumns = useMemo(
    () => [
      { id: "urgent", cards: sortCards(urgent) },
      { id: "active", cards: sortCards(active) },
      { id: "low", cards: sortCards(low) },
    ],
    [urgent, active, low, sortCards],
  );

  const { focusedCardId, showOverlay, setShowOverlay } = useKeyboardNav({
    columns: keyboardColumns,
    onAction: executeTaskAction,
    onOpenResolved: () => setDrawerOpen((prev) => !prev),
    onOpenTrash: () => setTrashOpen((prev) => !prev),
    searchRef,
    disabled: isAiMode || drawerOpen || trashOpen,
  });

  const taskDates = useMemo(() => {
    const s = new Set<string>();
    for (const t of localTasks) {
      const d = new Date(t.updatedAt);
      s.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      );
    }
    return s;
  }, [localTasks]);

  const reviewCount = localTasks.filter(
    (t) =>
      t.needsReview &&
      t.status !== "DONE" &&
      t.status !== "TRASHED" &&
      t.status !== "ARCHIVED",
  ).length;

  // Platforms that have at least one active task — used to dim
  // platforms with no data rather than disabling entirely.
  const activePlatforms = useMemo(() => {
    const s = new Set<string>();
    for (const t of localTasks) {
      if (
        t.status === "DONE" ||
        t.status === "TRASHED" ||
        t.status === "ARCHIVED"
      )
        continue;
      for (const e of t.sourceEvents) s.add(e.platform);
    }
    return s;
  }, [localTasks]);

  // Toggle spotlight: clicking a platform that's already spotlighted
  // removes it. If the result would be empty, clear spotlight (show all).
  function handlePlatformSpotlight(platform: string) {
    setFilters((f) => {
      const next = new Set(f.spotlightPlatforms);
      if (next.has(platform as Platform)) {
        next.delete(platform as Platform);
      } else {
        next.add(platform as Platform);
      }
      return { ...f, spotlightPlatforms: next };
    });
  }

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Platform spotlight — brand icons, active data platforms colored */}
      <PlatformFilterPill
        platforms={ALL_PLATFORMS}
        spotlight={filters.spotlightPlatforms}
        hasData={activePlatforms}
        onToggle={handlePlatformSpotlight}
      />

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Intent-based category filter */}
      <div className="flex items-center gap-1">
        {INTENT_GROUPS.map((group) => {
          const isActive = filters.intentGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  intentGroup:
                    f.intentGroup === group.id
                      ? "all"
                      : (group.id as IntentGroup),
                }))
              }
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-[0.97] ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600 hover:ring-1 hover:ring-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:ring-zinc-700"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* Review badge — only shown when there are tasks needing review */}
      {reviewCount > 0 && (
        <>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
          <button
            onClick={() =>
              setFilters((f) => ({ ...f, showReviewOnly: !f.showReviewOnly }))
            }
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
              filters.showReviewOnly
                ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/25"
                : "text-zinc-400 ring-1 ring-zinc-200 dark:text-zinc-500 dark:ring-zinc-800"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {reviewCount}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div>
      <SmartStats
        tasks={localTasks}
        trashedCount={localTrashedTasks.length}
        onOpenResolved={() => setDrawerOpen(true)}
        onOpenTrash={() => setTrashOpen(true)}
      />{" "}
      {/* Search bar */}
      <motion.div
        className="relative mb-4 rounded-xl"
        animate={{
          boxShadow: isAiMode
            ? "0 0 0 2px rgba(99,102,241,0.25), 0 4px 12px rgba(99,102,241,0.08)"
            : "0 1px 3px rgba(0,0,0,0.06)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Icon — crossfades with rotation between Search and Sparkles */}
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {isAiMode ? (
              <motion.div
                key="sparkles"
                initial={{ opacity: 0, rotate: 20, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -20, scale: 0.8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={searchRef}
          type="text"
          placeholder={
            isAiMode
              ? "Ask anything about your tasks... (Enter to send)"
              : "Search tasks...  ⌘K  |  / for AI  |  ? shortcuts"
          }
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className={`h-10 w-full rounded-xl pl-10 pr-4 text-sm outline-none transition-colors duration-250 ${
            isAiMode
              ? "border border-indigo-400/60 bg-indigo-50 text-indigo-900 placeholder:text-indigo-400 dark:border-indigo-500/40 dark:bg-indigo-500/[0.06] dark:text-indigo-100 dark:placeholder:text-indigo-500/60"
              : "border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40"
          }`}
        />

        {/* AI badge — fades in when AI mode active */}
        <AnimatePresence>
          {isAiMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400"
            >
              AI
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>{" "}
      {/* AI Response */}
      {(aiLoading || aiResponse) && (
        <div className="mb-5">
          {aiLoading ? (
            <AIResponseLoading />
          ) : aiResponse ? (
            <AIResponseCard
              response={aiResponse}
              onDismiss={() => {
                setAiResponse(null);
                setFilters((f) => ({ ...f, search: "" }));
              }}
              onExecuteAction={executeAiAction}
            />
          ) : null}
        </div>
      )}
      {/* Filters */}
      {!isAiMode && (
        <>
          <div className="mb-5 hidden md:block">{filterBar}</div>
          <div className="mb-5 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </span>
              <span className="text-[11px] text-zinc-400">
                {filters.spotlightPlatforms.size > 0
                  ? `${filters.spotlightPlatforms.size} platform${filters.spotlightPlatforms.size > 1 ? "s" : ""}`
                  : filters.intentGroup !== "all"
                    ? filters.intentGroup
                    : "All"}
              </span>
            </button>
            {mobileOpen && (
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                {filterBar}
              </div>
            )}
          </div>
        </>
      )}
      {/* Main layout */}
      {!isAiMode && (
        <div className="flex gap-5">
          <div className="hidden w-48 shrink-0 lg:block">
            <MiniCalendar
              taskDates={taskDates}
              selectedDate={filters.selectedDate}
              onSelectAction={(d) =>
                setFilters((f) => ({ ...f, selectedDate: d }))
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TaskCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-20 dark:border-zinc-800/40">
                <Inbox className="mb-3 h-12 w-12 animate-float text-zinc-300 dark:text-zinc-800" />
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  No signals found{" "}
                </p>
                <button
                  className="mt-3 text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  onClick={() =>
                    setFilters({
                      platforms: new Set(ALL_PLATFORMS),
                      statuses: new Set(ALL_STATUSES),
                      showReviewOnly: false,
                      spotlightPlatforms: new Set(),
                      intentGroup: "all",
                      search: "",
                      selectedDate: null,
                    })
                  }
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <KanbanColumn
                  title="Urgent"
                  icon={Flame}
                  iconColor="text-orange-500 dark:text-orange-400"
                  tasks={urgent}
                  totalIndex={0}
                  onTaskActionExec={executeTaskAction}
                  recentArrivalIds={recentArrivalIds}
                  focusedCardId={focusedCardId}
                />
                <KanbanColumn
                  title="Normal"
                  icon={Zap}
                  iconColor="text-blue-500 dark:text-blue-400"
                  tasks={active}
                  totalIndex={urgent.length}
                  onTaskActionExec={executeTaskAction}
                  recentArrivalIds={recentArrivalIds}
                  focusedCardId={focusedCardId}
                />
                <KanbanColumn
                  title="Low Priority"
                  icon={Minus}
                  iconColor="text-zinc-400 dark:text-zinc-500"
                  tasks={low}
                  totalIndex={urgent.length + active.length}
                  onTaskActionExec={executeTaskAction}
                  recentArrivalIds={recentArrivalIds}
                  focusedCardId={focusedCardId}
                />{" "}
              </div>
            )}
          </div>
        </div>
      )}
      <ResolvedDrawer
        tasks={localResolvedTasks}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskRestored={(taskId) => {
          const restored = localResolvedTasks.find((t) => t.id === taskId);
          if (restored) {
            setLocalTasks((prev) => [
              { ...restored, status: "OPEN" as NodalTask["status"] },
              // Remove the existing DONE version so SmartStats doesn't
              // double-count it — without this the counter never reverts.
              ...prev.filter((t) => t.id !== taskId),
            ]);
            setLocalResolvedTasks((prev) =>
              prev.filter((t) => t.id !== taskId),
            );
          }
        }}
        onTaskDeleted={(taskId) => {
          const deleted = localResolvedTasks.find((t) => t.id === taskId);
          if (deleted) {
            setLocalTrashedTasks((prev) => [
              {
                ...deleted,
                status: "TRASHED" as NodalTask["status"],
                trashedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
          setLocalResolvedTasks((prev) => prev.filter((t) => t.id !== taskId));
        }}
      />
      <TrashDrawer
        tasks={localTrashedTasks}
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        onTaskRestored={(taskId) => {
          const restored = localTrashedTasks.find((t) => t.id === taskId);
          if (restored) {
            setLocalTasks((prev) => [
              {
                ...restored,
                status: "OPEN" as NodalTask["status"],
                trashedAt: null,
              },
              ...prev,
            ]);
            setLocalTrashedTasks((prev) => prev.filter((t) => t.id !== taskId));
          }
        }}
        onTaskDeleted={(taskId) => {
          setLocalTrashedTasks((prev) => prev.filter((t) => t.id !== taskId));
        }}
        onTrashEmptied={() => {
          setLocalTrashedTasks([]);
        }}
      />{" "}
      <ShortcutOverlay
        open={showOverlay}
        onClose={() => setShowOverlay(false)}
      />
      {/* Footer */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-[10px] text-zinc-300 dark:text-zinc-500">
          <span className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
          Noise → Signal
          <span className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <button
          onClick={() => setShowOverlay(true)}
          className="flex items-center gap-1.5 text-[10px] text-zinc-300 transition-colors hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-500"
        >
          Press
          <kbd className="rounded border border-zinc-200 px-1 py-0.5 text-[9px] font-medium dark:border-zinc-700">
            ?
          </kbd>
          for keyboard shortcuts
        </button>
      </div>{" "}
    </div>
  );
}
