"use client";

import {
  AsanaSvg,
  GmailSvg,
  JiraSvg,
  SlackSvg,
  TrelloSvg,
} from "@/components/platform-icon";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, Filter, X, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

// =============================================================
// TYPES
// =============================================================

interface SignalData {
  totalOpen: number;
  resolvedToday: number;
  resolvedThisWeek: number;
  needsReviewCount: number;
  bookmarkedCount: number;
  avgConfidence: number;
  priorityMap: Record<string, number>;
  topIntents: { intent: string; count: number }[];
  platformCounts: Record<string, number>;
  dailyArrivals: { date: string; created: number; resolved: number }[];
}

interface PipelineData {
  totalEventsAllTime: number;
  eventsLast7Days: number;
  noiseFiltered: number;
  noiseFilterRate: number;
  totalTasksEver: number;
  mergedTasks: number;
  mergeRate: number;
  pipelinePlatformCounts: Record<string, number>;
  dailyMessages: { date: string; count: number }[];
  avgDailyMessages: number;
}

interface AnalyticsData {
  signal: SignalData;
  pipeline: PipelineData;
}

// =============================================================
// PLATFORM SVG MAP
// =============================================================

const PLATFORM_SVGS: Record<
  string,
  {
    Svg: (p: {
      className?: string;
      style?: React.CSSProperties;
    }) => React.ReactElement;
    color: string;
  }
> = {
  SLACK: { Svg: SlackSvg, color: "#4A154B" },
  GMAIL: { Svg: GmailSvg, color: "#D93025" },
  JIRA: { Svg: JiraSvg, color: "#0052CC" },
  TRELLO: { Svg: TrelloSvg, color: "#0079BF" },
  ASANA: { Svg: AsanaSvg, color: "#F06A6A" },
};

// =============================================================
// SHARED COMPONENTS
// =============================================================

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p
        className={`text-[22px] font-bold tabular-nums ${
          accent
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {sub && (
        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
          {sub}
        </p>
      )}
    </div>
  );
}

// Horizontal bar chart row
function BarRow({
  label,
  count,
  total,
  color = "bg-indigo-500",
  icon,
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
  icon?: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      {icon && <div className="w-3.5 shrink-0">{icon}</div>}
      <span className="w-28 shrink-0 truncate text-[11px] text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
          {count}
        </span>
      </div>
    </div>
  );
}

// Sparkline — minimal bar chart for daily data
function Sparkline({
  data,
  color = "bg-indigo-500",
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <motion.div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-80`}
          style={{ height: `${Math.max(2, (v / max) * height)}px` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
        />
      ))}
    </div>
  );
}

// =============================================================
// SIGNAL TAB
// =============================================================

function SignalTab({ data }: { data: SignalData }) {
  const PRIORITY_CONFIG = [
    { key: "CRITICAL", label: "Critical", color: "bg-red-500" },
    { key: "HIGH", label: "High", color: "bg-orange-400" },
    { key: "MEDIUM", label: "Medium", color: "bg-blue-400" },
    { key: "LOW", label: "Low", color: "bg-zinc-300 dark:bg-zinc-600" },
  ];

  const totalPriority = Object.values(data.priorityMap).reduce(
    (s, v) => s + v,
    0,
  );
  const totalPlatform = Object.values(data.platformCounts).reduce(
    (s, v) => s + v,
    0,
  );
  const totalIntents = data.topIntents.reduce((s, i) => s + i.count, 0);

  // 7-day arrival sparkline
  const last7Arrivals = data.dailyArrivals.slice(-7).map((d) => d.created);

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Open tasks" value={data.totalOpen} accent />
        <StatCard
          label="Done today"
          value={data.resolvedToday}
          sub={`${data.resolvedThisWeek} this week`}
        />
        <StatCard
          label="Avg confidence"
          value={`${data.avgConfidence}%`}
          sub="AI extraction quality"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Need review"
          value={data.needsReviewCount}
          sub="Low AI confidence"
        />
        <StatCard label="Bookmarked" value={data.bookmarkedCount} />
      </div>

      {/* Daily arrivals sparkline */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Task arrivals — last 7 days
          </span>
          <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            avg {Math.round(last7Arrivals.reduce((s, v) => s + v, 0) / 7)}/day
          </span>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Sparkline data={last7Arrivals} color="bg-indigo-400" height={36} />
          <div className="mt-1.5 flex justify-between">
            {data.dailyArrivals.slice(-7).map((d) => (
              <span
                key={d.date}
                className="flex-1 text-center text-[8px] text-zinc-400 dark:text-zinc-600"
              >
                {d.date.split(" ")[1]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div>
        <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          By priority
        </span>
        <div className="space-y-2">
          {PRIORITY_CONFIG.filter(
            (p) => (data.priorityMap[p.key] ?? 0) > 0,
          ).map((p) => (
            <BarRow
              key={p.key}
              label={p.label}
              count={data.priorityMap[p.key] ?? 0}
              total={totalPriority}
              color={p.color}
            />
          ))}
          {totalPriority === 0 && (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No active tasks
            </p>
          )}
        </div>
      </div>

      {/* Intent breakdown */}
      {data.topIntents.length > 0 && (
        <div>
          <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            By intent
          </span>
          <div className="space-y-2">
            {data.topIntents.map((item) => (
              <BarRow
                key={item.intent}
                label={item.intent.replace(/-/g, " ")}
                count={item.count}
                total={totalIntents}
                color="bg-violet-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Platform breakdown */}
      {totalPlatform > 0 && (
        <div>
          <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Task sources
          </span>
          <div className="space-y-2">
            {Object.entries(data.platformCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => {
                const cfg = PLATFORM_SVGS[platform];
                return (
                  <BarRow
                    key={platform}
                    label={platform.charAt(0) + platform.slice(1).toLowerCase()}
                    count={count}
                    total={totalPlatform}
                    color="bg-emerald-400"
                    icon={
                      cfg ? (
                        <cfg.Svg
                          className="h-3 w-3"
                          style={{ color: cfg.color }}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// PIPELINE TAB
// =============================================================

function PipelineTab({ data }: { data: PipelineData }) {
  const totalPlatform = Object.values(data.pipelinePlatformCounts).reduce(
    (s, v) => s + v,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Messages received"
          value={data.totalEventsAllTime.toLocaleString()}
          sub="All time"
          accent
        />
        <StatCard
          label="Noise filtered"
          value={`${data.noiseFilterRate}%`}
          sub={`${data.noiseFiltered.toLocaleString()} messages`}
        />
        <StatCard
          label="Tasks created"
          value={data.totalTasksEver.toLocaleString()}
          sub="From all messages"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Merge rate"
          value={`${data.mergeRate}%`}
          sub={`${data.mergedTasks} tasks merged`}
        />
        <StatCard
          label="Avg messages/day"
          value={data.avgDailyMessages}
          sub="Last 7 days"
        />
      </div>

      {/* Refinery breakdown — stacked horizontal bar */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
            Message breakdown
          </span>
          <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {data.totalEventsAllTime.toLocaleString()} total
          </span>
        </div>

        {/* Stacked bar */}
        {data.totalEventsAllTime > 0 ? (
          <>
            <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full">
              {/* Noise segment */}
              <motion.div
                className="flex items-center justify-center bg-zinc-300 dark:bg-zinc-600"
                style={{ width: `${data.noiseFilterRate}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${data.noiseFilterRate}%` }}
                transition={{ duration: 0.6, ease: "easeOut" as const }}
                title={`Noise: ${data.noiseFiltered} messages`}
              />
              {/* Merged segment — messages that merged into existing tasks */}
              {data.mergeRate > 0 && (
                <motion.div
                  className="flex items-center justify-center bg-amber-400"
                  style={{
                    width: `${Math.round(
                      (data.mergedTasks / data.totalEventsAllTime) * 100,
                    )}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.round(
                      (data.mergedTasks / data.totalEventsAllTime) * 100,
                    )}%`,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.1,
                    ease: "easeOut" as const,
                  }}
                  title={`Merged: ${data.mergedTasks} tasks`}
                />
              )}
              {/* Tasks segment */}
              <motion.div
                className="flex-1 bg-indigo-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                title={`Tasks: ${data.totalTasksEver}`}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                {
                  color: "bg-zinc-300 dark:bg-zinc-600",
                  label: "Noise filtered",
                  value: data.noiseFiltered,
                  pct: data.noiseFilterRate,
                },
                {
                  color: "bg-amber-400",
                  label: "Merged messages",
                  value: data.mergedTasks,
                  pct: Math.round(
                    (data.mergedTasks / data.totalEventsAllTime) * 100,
                  ),
                },
                {
                  color: "bg-indigo-500",
                  label: "Tasks created",
                  value: data.totalTasksEver,
                  pct: Math.round(
                    (data.totalTasksEver / data.totalEventsAllTime) * 100,
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${item.color}`}
                  />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                    {item.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ({item.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
            No messages processed yet
          </p>
        )}
      </div>

      {/* Daily message volume sparkline */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Message volume — last 7 days
          </span>
          <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {data.eventsLast7Days} total
          </span>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Sparkline
            data={data.dailyMessages.map((d) => d.count)}
            color="bg-amber-400"
            height={36}
          />
          <div className="mt-1.5 flex justify-between">
            {data.dailyMessages.map((d) => (
              <span
                key={d.date}
                className="flex-1 text-center text-[8px] text-zinc-400 dark:text-zinc-600"
              >
                {d.date}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Platform message breakdown */}
      {totalPlatform > 0 && (
        <div>
          <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Message sources (last 7 days)
          </span>
          <div className="space-y-2">
            {Object.entries(data.pipelinePlatformCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => {
                const cfg = PLATFORM_SVGS[platform];
                return (
                  <BarRow
                    key={platform}
                    label={platform.charAt(0) + platform.slice(1).toLowerCase()}
                    count={count}
                    total={totalPlatform}
                    color="bg-amber-400"
                    icon={
                      cfg ? (
                        <cfg.Svg
                          className="h-3 w-3"
                          style={{ color: cfg.color }}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// ANALYTICS MODAL
// =============================================================

type Tab = "signal" | "pipeline";

const TABS: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: "signal", label: "Signal", icon: Zap },
  { id: "pipeline", label: "Pipeline", icon: Filter },
];

export function AnalyticsModal({
  open,
  onClose,
}: {
  open: boolean;

  onClose: () => void;
}): React.ReactElement | null {
  const [tab, setTab] = useState<Tab>("signal");

  // Auto-refetches whenever a task event fires via Supabase realtime.
  // enabled=open means we only fetch when the modal is visible.
  const { data, loading, error, refetch } = useRealtimeData<AnalyticsData>(
    () => fetch("/api/analytics").then((r) => r.json()),
    { enabled: open, debounceMs: 400 },
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-[10000] flex h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-zinc-400" />
                <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Analytics
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 items-center gap-1 border-b border-zinc-100 px-5 dark:border-zinc-800">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`relative flex items-center gap-1.5 px-1 py-3 text-[12px] font-medium transition-colors ${
                    tab === id
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {tab === id && (
                    <motion.div
                      layoutId="analytics-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-zinc-900 dark:bg-white"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
              {/* Last updated */}
              {data && !loading && (
                <span className="ml-auto text-[10px] text-zinc-300 dark:text-zinc-700">
                  Just now
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-none">
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                    />
                  ))}
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                    Failed to load analytics
                  </p>
                  <button
                    onClick={refetch}
                    className="mt-3 text-[12px] text-indigo-500 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && data && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: tab === "signal" ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tab === "signal" ? 8 : -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {tab === "signal" && <SignalTab data={data.signal} />}
                    {tab === "pipeline" && <PipelineTab data={data.pipeline} />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
