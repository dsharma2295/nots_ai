"use client";

import {
  AsanaSvg,
  GmailSvg,
  JiraSvg,
  SlackSvg,
  TrelloSvg,
} from "@/components/platform-icon";
import { TaskCardStencil } from "@/components/task-card-stencil";
import { useToast } from "@/components/toast";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { AnimatePresence, motion } from "framer-motion";
import {
  Info,
  Layers,
  Plug,
  Settings,
  Shield,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// TYPES
// =============================================================

interface UserPreferences {
  noiseKeywords: string[];
  urgentKeywords: string[];
  intentPriorityMap: Record<string, string>;
  autoRefreshInterval: number;
  ignoredPlatforms: string[];
  minMessageLength: number;
}

const DEFAULT_PREFS: UserPreferences = {
  noiseKeywords: [],
  urgentKeywords: ["urgent", "ASAP", "blocker", "outage", "down", "critical"],
  intentPriorityMap: {},
  autoRefreshInterval: 15,
  ignoredPlatforms: [],
  minMessageLength: 3,
};

interface PipelineStats {
  totalTasks: number;
  totalEvents: number;
  noiseFiltered: number;
  noiseFilterRate: number;
  needsReview: number;
}

// =============================================================
// SECTION CONFIG
// =============================================================

type SectionId =
  | "anatomy"
  | "general"
  | "noise"
  | "priority"
  | "integrations"
  | "about";

const SECTIONS: { id: SectionId; label: string; Icon: typeof Settings }[] = [
  { id: "anatomy", label: "Card Anatomy", Icon: Layers },
  { id: "general", label: "General", Icon: Sun },
  { id: "noise", label: "Noise Filters", Icon: Shield },
  { id: "priority", label: "Priority Rules", Icon: Zap },
  { id: "integrations", label: "Integrations", Icon: Plug },
  { id: "about", label: "About", Icon: Info },
];

const INTENT_GROUPS = [
  {
    id: "action",
    label: "Action",
    description: "task-assignment, bug-fix, deploy",
  },
  {
    id: "review",
    label: "Review",
    description: "document-review, code-review",
  },
  {
    id: "respond",
    label: "Respond",
    description: "question, approval-request",
  },
  { id: "attend", label: "Attend", description: "meeting-request, schedule" },
  { id: "read", label: "Read", description: "information-sharing, FYI" },
] as const;

const PRIORITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 dark:text-red-400",
  HIGH: "text-orange-500 dark:text-orange-400",
  MEDIUM: "text-blue-500 dark:text-blue-400",
  LOW: "text-zinc-400 dark:text-zinc-500",
};

const INTEGRATION_CONFIG = [
  {
    platform: "SLACK",
    label: "Slack",
    Svg: SlackSvg,
    color: "#4A154B",
    description: "Receives mentions, DMs, and app_mention events",
    envKey: "SLACK_BOT_TOKEN",
  },
  {
    platform: "GMAIL",
    label: "Gmail",
    Svg: GmailSvg,
    color: "#D93025",
    description: "Watches inbox via Gmail Push Notifications",
    envKey: "GMAIL_CLIENT_ID",
  },
  {
    platform: "JIRA",
    label: "Jira",
    Svg: JiraSvg,
    color: "#0052CC",
    description: "Receives issue assignments and mentions",
    envKey: "JIRA_TOKEN",
    comingSoon: true,
  },
  {
    platform: "TRELLO",
    label: "Trello",
    Svg: TrelloSvg,
    color: "#0079BF",
    description: "Card assignments and board activity",
    comingSoon: true,
  },
  {
    platform: "ASANA",
    label: "Asana",
    Svg: AsanaSvg,
    color: "#F06A6A",
    description: "Task assignments and project updates",
    comingSoon: true,
  },
];

// =============================================================
// TAG INPUT
// Reusable chip input for keyword lists
// =============================================================

function TagInput({
  tags,
  onChange,
  placeholder,
  maxTags = 50,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  maxTags?: number;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div
      className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 focus-within:border-zinc-300 focus-within:ring-1 focus-within:ring-zinc-300/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:focus-within:border-zinc-600"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === "Backspace" && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-30 flex-1 bg-transparent text-[12px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
      />
    </div>
  );
}

// =============================================================
// SECTION COMPONENTS
// =============================================================

function GeneralSection({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Appearance
        </label>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-lg border py-2 text-[12px] font-medium capitalize transition-all active:scale-[0.97] ${
                theme === t
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-refresh */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Dashboard Refresh
        </label>
        <div className="flex gap-2">
          {[
            { value: 15, label: "15s" },
            { value: 30, label: "30s" },
            { value: 60, label: "1 min" },
            { value: 300, label: "5 min" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                onChange({ ...prefs, autoRefreshInterval: opt.value })
              }
              className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-all active:scale-[0.97] ${
                prefs.autoRefreshInterval === opt.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Real-time updates via Supabase. Polling is a fallback.
        </p>
      </div>

      {/* Minimum message length */}
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Min. Message Length
        </label>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Messages shorter than this are discarded before AI processing.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={50}
            value={prefs.minMessageLength}
            onChange={(e) =>
              onChange({ ...prefs, minMessageLength: parseInt(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer accent-zinc-900 dark:accent-white"
          />
          <span className="w-10 shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-center text-[12px] font-medium tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {prefs.minMessageLength}
          </span>
        </div>
      </div>
    </div>
  );
}

function NoiseSection({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) {
  const platformOptions = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Custom Noise Keywords
        </label>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Messages containing only these words are discarded before reaching the
          AI. Type a word and press Enter.
        </p>
        <TagInput
          tags={prefs.noiseKeywords}
          onChange={(tags) => onChange({ ...prefs, noiseKeywords: tags })}
          placeholder="standup, lgtm, merged, +1..."
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Ignore Platforms
        </label>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Skip processing from selected platforms entirely.
        </p>
        <div className="flex flex-wrap gap-2">
          {platformOptions.map((p) => {
            const ignored = prefs.ignoredPlatforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => {
                  const next = ignored
                    ? prefs.ignoredPlatforms.filter((x) => x !== p)
                    : [...prefs.ignoredPlatforms, p];
                  onChange({ ...prefs, ignoredPlatforms: next });
                }}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium capitalize transition-all active:scale-95 ${
                  ignored
                    ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrioritySection({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: UserPreferences) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Custom Urgency Triggers
        </label>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Messages containing these words are assigned CRITICAL priority.
          Overrides AI default.
        </p>
        <TagInput
          tags={prefs.urgentKeywords}
          onChange={(tags) => onChange({ ...prefs, urgentKeywords: tags })}
          placeholder="p0, sev1, escalate, prod down..."
          maxTags={50}
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Intent → Priority Overrides
        </label>
        <p className="mb-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Force a specific priority for each intent group. Overrides the
          AI&apos;s suggestion.
        </p>
        <div className="space-y-2">
          {INTENT_GROUPS.map((group) => {
            const current = prefs.intentPriorityMap[group.id] ?? "";
            return (
              <div key={group.id} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                    {group.label}
                  </span>
                  <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                    {group.description}
                  </p>
                </div>
                <div className="flex flex-1 gap-1.5">
                  <button
                    onClick={() => {
                      const next = { ...prefs.intentPriorityMap };
                      delete next[group.id];
                      onChange({ ...prefs, intentPriorityMap: next });
                    }}
                    className={`flex-1 rounded-md border py-1 text-[10px] font-medium transition-all ${
                      !current
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-500"
                    }`}
                  >
                    AI
                  </button>
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        onChange({
                          ...prefs,
                          intentPriorityMap: {
                            ...prefs.intentPriorityMap,
                            [group.id]: p,
                          },
                        })
                      }
                      className={`flex-1 rounded-md border py-1 text-[10px] font-semibold transition-all ${
                        current === p
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                          : `border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 ${PRIORITY_COLORS[p]}`
                      }`}
                    >
                      {p === "CRITICAL"
                        ? "CRIT"
                        : p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="space-y-3">
      {INTEGRATION_CONFIG.map(
        ({ platform, label, Svg, color, description, comingSoon }) => (
          <div
            key={platform}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
              comingSoon
                ? "border-zinc-100 dark:border-zinc-800/50"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {/* Icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${color}15` }}
            >
              <Svg className="h-4 w-4" style={{ color }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">
                  {label}
                </span>
                {comingSoon ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                    Soon
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                {description}
              </p>
            </div>

            {/* Action */}
            {!comingSoon && (
              <button className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:text-zinc-700 active:scale-95 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200">
                Test
              </button>
            )}
          </div>
        ),
      )}
    </div>
  );
}

function AboutSection({ stats }: { stats: PipelineStats | null }) {
  return (
    <div className="space-y-6">
      {/* Pipeline stats */}
      <div>
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Pipeline Stats
        </label>
        {stats ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Messages in",
                value: stats.totalEvents.toLocaleString(),
                color: "text-zinc-700 dark:text-zinc-100",
              },
              {
                label: "Tasks created",
                value: stats.totalTasks.toLocaleString(),
                color: "text-indigo-600 dark:text-indigo-400",
              },
              {
                label: "Noise filtered",
                value: `${stats.noiseFilterRate}%`,
                color: "text-emerald-600 dark:text-emerald-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <p
                  className={`text-[20px] font-bold tabular-nums ${stat.color}`}
                >
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts */}
      <div>
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
          Keyboard Shortcuts
        </label>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {[
            ["⌘K", "Focus search"],
            ["/", "AI query mode"],
            ["↑↓", "Navigate cards"],
            ["→←", "Switch columns"],
            ["Enter", "Expand card"],
            ["D", "Mark done"],
            ["B", "Bookmark"],
            ["T", "Move to trash"],
            ["N", "Add note"],
            ["R", "Open resolved"],
            ["X", "Open trash"],
            ["?", "Show shortcuts"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <kbd className="min-w-8 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-center text-[10px] font-medium text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                {key}
              </kbd>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Version */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
          Nots.ai
        </span>
        <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
          v1.0.0 — Capstone Build
        </span>
      </div>
    </div>
  );
}

// =============================================================
// SETTINGS MODAL
// =============================================================

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;

  onClose: () => void;
}): React.ReactElement | null {
  const [activeSection, setActiveSection] = useState<SectionId>("anatomy");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Pipeline stats for About section — auto-refetches on task events
  const { data: statsData } = useRealtimeData<PipelineStats>(
    () => fetch("/api/settings", { method: "PUT" }).then((r) => r.json()),
    { enabled: open && activeSection === "about", debounceMs: 600 },
  );

  // Load preferences when modal opens (prefs don't need realtime — user edits them)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferences) setPrefs(data.preferences);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);
  // Auto-save with 800ms debounce
  const handleChange = useCallback(
    (updated: UserPreferences) => {
      setPrefs(updated);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
          if (res.ok) {
            toast("Settings saved", "success");
          }
        } catch {
          toast("Failed to save settings", "error");
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [toast],
  );

  if (typeof window === "undefined") return null;

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
            className="relative z-[10000] flex h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── LEFT NAV ── */}
            <div className="flex w-44 shrink-0 flex-col border-r border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 pb-3 pt-5">
                <Settings className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  Settings
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 px-2 pb-4">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${
                      activeSection === id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Save indicator */}
              <div className="px-4 pb-4">
                <AnimatePresence>
                  {saving && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                      Saving…
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Content header */}
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
                {loading && activeSection !== "anatomy" ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                      />
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {activeSection === "anatomy" && <TaskCardStencil />}
                      {activeSection === "general" && (
                        <GeneralSection prefs={prefs} onChange={handleChange} />
                      )}
                      {activeSection === "noise" && (
                        <NoiseSection prefs={prefs} onChange={handleChange} />
                      )}
                      {activeSection === "priority" && (
                        <PrioritySection
                          prefs={prefs}
                          onChange={handleChange}
                        />
                      )}
                      {activeSection === "integrations" && (
                        <IntegrationsSection />
                      )}
                      {activeSection === "about" && (
                        <AboutSection stats={statsData} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
