"use client";
import { useRealtimeContext } from "@/components/providers/realtime-provider";
import { QuickAddModal } from "@/components/quick-add-modal";
import { useToast } from "@/components/toast";
import { AIResponseCard, AIResponseLoading } from "@/features/ai/ai-response";
import { ResolvedDrawer } from "@/features/drawers/resolved-drawer";
import { TrashDrawer } from "@/features/drawers/trash-drawer";
import { useKeyboardNav } from "@/features/keyboard/hooks/use-keyboard-nav";
import { ShortcutOverlay } from "@/features/keyboard/shortcut-overlay";
import { TaskCard } from "@/features/task-card/task-card";
import { TaskCardSkeleton } from "@/features/task-card/task-card-skeleton";
import { useCmdK } from "@/hooks";
import type { AIQueryResponse } from "@/lib/validators/ai-query";
import type { NodalTask, Platform } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  Flame,
  Inbox,
  Layers,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ALL_PLATFORMS,
  ALL_STATUSES,
  INTENT_GROUPS,
  matchIntentGroup,
  type Filters,
  type IntentGroup,
} from "./helpers";
import { KanbanColumn } from "./kanban-column";

import {
  AsanaSvg,
  GmailSvg,
  JiraSvg,
  SlackSvg,
  TrelloSvg,
} from "@/components/platform-icon";
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
    Icon: SlackSvg,
    brand: "#4A154B",
    chipBg: "rgba(74,21,75,0.08)",
    chipBgDark: "rgba(155,89,165,0.12)",
    inactiveIcon: "rgba(74,21,75,0.3)",
  },
  GMAIL: {
    label: "Gmail",
    Icon: GmailSvg,
    brand: "#EA4335",
    chipBg: "rgba(234,67,53,0.08)",
    chipBgDark: "rgba(234,67,53,0.12)",
    inactiveIcon: "rgba(234,67,53,0.3)",
  },
  JIRA: {
    label: "Jira",
    Icon: JiraSvg,
    brand: "#0052CC",
    chipBg: "rgba(0,82,204,0.08)",
    chipBgDark: "rgba(76,154,255,0.12)",
    inactiveIcon: "rgba(0,82,204,0.3)",
  },
  TRELLO: {
    label: "Trello",
    Icon: TrelloSvg,
    brand: "#0079BF",
    chipBg: "rgba(0,121,191,0.08)",
    chipBgDark: "rgba(0,194,224,0.12)",
    inactiveIcon: "rgba(0,121,191,0.3)",
  },
  ASANA: {
    label: "Asana",
    Icon: AsanaSvg,
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

// =============================================================
// TIER FILTER DROPDOWN
// Compact dropdown with checkboxes for P1, P2, P3, None.
// Empty selection = show all (no filter active).
// =============================================================

const TIER_OPTIONS_FILTER = [
  {
    tier: 1,
    label: "P1",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
  },
  {
    tier: 2,
    label: "P2",
    badge: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
  },
  {
    tier: 3,
    label: "P3",
    badge: "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100",
  },
  { tier: 0, label: "None", badge: "" },
];

// =============================================================
// DATE DROPDOWN — quick presets + inline mini-calendar
// =============================================================

type DateFilter =
  | { type: "range"; range: "today" | "week" | "month" }
  | { type: "date"; date: string }
  | null;

function DateDropdown({
  value,
  onChange,
}: {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = (() => {
    if (!value) return "Date";
    if (value.type === "range") {
      return value.range === "today"
        ? "Today"
        : value.range === "week"
          ? "This week"
          : "This month";
    }
    return new Date(value.date + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  })();

  const isActive = value !== null;

  // Calendar helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayStr = new Date().toISOString().slice(0, 10);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
          isActive
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "text-zinc-400 ring-1 ring-zinc-200 hover:text-zinc-600 hover:ring-zinc-300 dark:text-zinc-500 dark:ring-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        <CalendarDays className="h-3 w-3" />
        {label}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="h-3 w-3 opacity-60"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" as const }}
            className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            {/* Quick presets */}
            <div className="p-1.5">
              {(["today", "week", "month"] as const).map((range) => {
                const rangeLabel =
                  range === "today"
                    ? "Today"
                    : range === "week"
                      ? "This week"
                      : "This month";
                const isSelected =
                  value?.type === "range" && value.range === range;
                return (
                  <button
                    key={range}
                    onClick={() => {
                      onChange(isSelected ? null : { type: "range", range });
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    {rangeLabel}
                  </button>
                );
              })}
            </div>

            <div className="mx-3 h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Mini calendar */}
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                    <path
                      d="M10 4L6 8l4 4"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {monthName}
                </span>
                <button
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-medium text-zinc-400"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {days.map((day, i) => {
                  if (!day) return <span key={i} />;
                  const ds = dateStr(day);
                  const isToday = ds === todayStr;
                  const isSelected =
                    value?.type === "date" && value.date === ds;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        onChange(
                          isSelected ? null : { type: "date", date: ds },
                        );
                        setOpen(false);
                      }}
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : isToday
                            ? "bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {isActive && (
              <>
                <div className="mx-3 h-px bg-zinc-100 dark:bg-zinc-800" />
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    Clear date filter
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TierDropdown({
  selected,
  onChange,
}: {
  selected: Set<number>;
  onChange: (tiers: Set<number>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle(tier: number) {
    const next = new Set(selected);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    onChange(next);
  }

  const label =
    selected.size === 0
      ? "Tier"
      : [...selected]
          .sort()
          .map((t) => (t === 0 ? "None" : `P${t}`))
          .join(", ");

  const isActive = selected.size > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
          isActive
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "text-zinc-400 ring-1 ring-zinc-200 hover:text-zinc-600 hover:ring-zinc-300 dark:text-zinc-500 dark:ring-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        {label}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="h-3 w-3 opacity-60"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" as const }}
            className="absolute left-0 top-full z-50 mt-1.5 w-32 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            {TIER_OPTIONS_FILTER.map(({ tier, label, badge }) => {
              const checked = selected.has(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggle(tier)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      checked
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-2.5 w-2.5 text-white dark:text-zinc-900"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </span>
                  {badge ? (
                    <span
                      className={`inline-flex h-4 items-center justify-center rounded px-1.5 text-[9px] font-bold leading-none ${badge}`}
                    >
                      {label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {label}
                    </span>
                  )}
                </button>
              );
            })}
            {selected.size > 0 && (
              <>
                <div className="mx-2 my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                <button
                  onClick={() => {
                    onChange(new Set());
                    setOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Clear
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
}): React.ReactElement {
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
    selectedTiers: new Set<number>(),
    spotlightPlatforms: new Set<(typeof ALL_PLATFORMS)[number]>(),
    intentGroup: "all",
    search: "",
    selectedDate: null,
    dateRange: null,
    dateFilter: null,
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  // Listen for sidebar icon clicks — sidebar can't reach drawer state directly
  useEffect(() => {
    const openResolved = () => setDrawerOpen(true);
    const openTrash = () => setTrashOpen(true);
    window.addEventListener("nots:openResolved", openResolved);
    window.addEventListener("nots:openTrash", openTrash);
    return () => {
      window.removeEventListener("nots:openResolved", openResolved);
      window.removeEventListener("nots:openTrash", openTrash);
    };
  }, []);
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

      // Review filter — restored: was accidentally dropped in last refactor
      if (filters.showReviewOnly && !t.needsReview) return false;

      // Tier filter: 0 = no tier assigned, 1/2/3 = P1/P2/P3
      if (filters.selectedTiers.size > 0) {
        const taskTier = t.tier ?? 0;
        if (!filters.selectedTiers.has(taskTier)) return false;
      }

      if (filterText) {
        const q = filterText.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.sourceEvents.some((e) => e.rawContent.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.dateFilter) {
        const now = new Date();
        const taskDate = new Date(t.updatedAt);
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        if (filters.dateFilter.type === "range") {
          if (filters.dateFilter.range === "today") {
            if (taskDate < startOfToday) return false;
          } else if (filters.dateFilter.range === "week") {
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (taskDate < weekAgo) return false;
          } else if (filters.dateFilter.range === "month") {
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (taskDate < monthAgo) return false;
          }
        } else if (filters.dateFilter.type === "date") {
          const ds = taskDate.toISOString().slice(0, 10);
          if (ds !== filters.dateFilter.date) return false;
        }
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

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Tier filter dropdown */}
      <TierDropdown
        selected={filters.selectedTiers}
        onChange={(tiers) =>
          setFilters((f) => ({ ...f, selectedTiers: tiers }))
        }
      />

      {/* Date dropdown with mini-calendar */}
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
      <DateDropdown
        value={filters.dateFilter}
        onChange={(v) => setFilters((f) => ({ ...f, dateFilter: v }))}
      />

      {/* Review badge */}
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

      {/* Clear all filters — only shown when any filter is active */}
      {(filters.spotlightPlatforms.size > 0 ||
        filters.intentGroup !== "all" ||
        filters.selectedTiers.size > 0 ||
        filters.dateFilter !== null ||
        filters.showReviewOnly) && (
        <button
          onClick={() =>
            setFilters((f) => ({
              ...f,
              spotlightPlatforms: new Set(),
              intentGroup: "all",
              selectedTiers: new Set(),
              dateFilter: null,
              dateRange: null,
              showReviewOnly: false,
            }))
          }
          className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-[0.97] dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          ✕ Clear
        </button>
      )}

      {/* Focus mode toggle — always visible at far right */}
      <button
        onClick={() => setFocusMode((prev) => !prev)}
        className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
          focusMode
            ? "bg-indigo-500 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-600 hover:ring-1 hover:ring-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:ring-zinc-700"
        }`}
        title="Focus mode — single prioritised list"
      >
        <Layers className="h-3 w-3" />
        Focus
      </button>
    </div>
  );

  return (
    <div>
      <SmartStats tasks={localTasks} onQuickAdd={() => setQuickAddOpen(true)} />{" "}
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
              ? "border border-indigo-400/60 bg-indigo-50 text-indigo-900 placeholder:text-indigo-400 dark:border-indigo-500/40 dark:bg-indigo-500/6 dark:text-indigo-100 dark:placeholder:text-indigo-500/60"
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
      {/* AI Response — AnimatePresence ensures skeleton fades out
          and real card fades in with no layout jump */}
      {(aiLoading || aiResponse) && (
        <div className="mb-5">
          <AnimatePresence mode="wait">
            {aiLoading ? (
              <motion.div
                key="ai-skeleton"
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.15 }}
              >
                <AIResponseLoading />
              </motion.div>
            ) : aiResponse ? (
              <motion.div
                key="ai-response"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                <AIResponseCard
                  response={aiResponse}
                  onDismiss={() => {
                    setAiResponse(null);
                    setFilters((f) => ({ ...f, search: "" }));
                  }}
                  onExecuteAction={executeAiAction}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
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
        <div className="min-w-0">
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
                    selectedTiers: new Set(),
                    spotlightPlatforms: new Set(),
                    intentGroup: "all",
                    search: "",
                    selectedDate: null,
                    dateRange: null,
                    dateFilter: null,
                  })
                }
              >
                Reset filters
              </button>
            </div>
          ) : focusMode ? (
            // Focus mode — single flat list sorted by priority then recency
            <div className="space-y-2">
              {[...urgent, ...active, ...low].map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  onTaskActionExec={executeTaskAction}
                  isNewArrival={recentArrivalIds.has(task.id)}
                  isKeyboardFocused={focusedCardId === task.id}
                />
              ))}
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
      {/* Quick Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreate={async ({ title, priority, tier, notes, intent }) => {
          const res = await fetch("/api/tasks/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "createTask",
              title,
              priority,
              tier,
              notes,
              intent,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.task) {
              const newTask: NodalTask = {
                id: data.task.id,
                title: data.task.title,
                intent,
                priority,
                status: "OPEN",
                confidence: 1.0,
                needsReview: false,
                tier,
                bookmarked: false,
                seenEventCount: 0,
                noteCount: notes ? 1 : 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                trashedAt: null,
                hasBeenOpened: false,
                sourceEvents: [],
              };
              setLocalTasks((prev) => [newTask, ...prev]);
            }
          }
        }}
      />
    </div>
  );
}
