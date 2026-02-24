// =============================================================
// TIER CONFIG — full card sheen
// 1: Gold, 2: Silver, 3: Bronze
// =============================================================

export const TIER_STYLE: Record<
  number,
  { card: string; badge: string; label: string }
> = {
  1: {
    card: "border-amber-400/50 bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 dark:border-amber-500/50",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-sm",
    label: "P1",
  },
  2: {
    card: "border-slate-300/60 bg-gradient-to-br from-slate-100/80 via-slate-50/40 to-white dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 dark:border-slate-400/40",
    badge:
      "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800 shadow-sm",
    label: "P2",
  },
  3: {
    card: "border-amber-700/30 bg-gradient-to-br from-orange-50/60 via-amber-50/30 to-white dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 dark:border-amber-600/40",
    badge:
      "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100 shadow-sm",
    label: "P3",
  },
};

export const DEFAULT_CARD =
  "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800";

// =============================================================
// COLUMN / TIER OPTIONS
// =============================================================

export const COLUMN_OPTIONS = [
  {
    label: "Urgent",
    priority: "HIGH" as const,
    color:
      "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10",
  },
  {
    label: "Normal",
    priority: "MEDIUM" as const,
    color:
      "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10",
  },
  {
    label: "Low Priority",
    priority: "LOW" as const,
    color:
      "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-500/10",
  },
];

export const TIER_OPTIONS = [
  {
    tier: 1,
    label: "Gold",
    sublabel: "P1",
    badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
  },
  {
    tier: 2,
    label: "Silver",
    sublabel: "P2",
    badgeClass: "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800",
  },
  {
    tier: 3,
    label: "Bronze",
    sublabel: "P3",
    badgeClass: "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-100",
  },
];

// =============================================================
// STATUS CONFIG
// =============================================================

export const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-emerald-500",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-500",
  DONE: "bg-zinc-400 dark:bg-zinc-600",
  ARCHIVED: "bg-zinc-300 dark:bg-zinc-700",
};

export const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Active",
  BLOCKED: "Blocked",
  DONE: "Done",
  ARCHIVED: "Archived",
};
