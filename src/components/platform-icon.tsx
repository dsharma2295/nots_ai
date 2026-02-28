"use client";

import type { Platform } from "@/lib/mock-data";
import { Pencil } from "lucide-react";

// =============================================================
// BRAND SVG ICONS
// All 5 platform icons as inline SVGs — no external CDN.
// Sourced from Bootstrap Icons (Slack, Trello) and
// Simple Icons (Gmail, Jira, Asana).
// Centralised here so every component in the product uses
// the same real brand marks, not lucide approximations.
// =============================================================

export function SlackSvg({
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

export function GmailSvg({
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

export function JiraSvg({
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

export function TrelloSvg({
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

export function AsanaSvg({
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

// =============================================================
// CONFIG
// Single source of truth for brand colors + icons.
// Used by PlatformIcon, PlatformBadge, PlatformDot.
// =============================================================

type PlatformConfig = {
  label: string;
  // Brand SVG component
  Svg: (props: {
    className?: string;
    style?: React.CSSProperties;
  }) => React.ReactElement;
  // Icon chip: brand color for the SVG, bg for the chip container
  iconColor: { light: string; dark: string };
  chipBg: { light: string; dark: string };
  // Badge (text + icon pill in timeline)
  badge: { light: string; dark: string };
  // Dot (colored circle — kept for timeline connector)
  dot: { light: string; dark: string };
};

const CONFIG: Record<Platform, PlatformConfig> = {
  SLACK: {
    label: "Slack",
    Svg: SlackSvg,
    iconColor: { light: "#4A154B", dark: "#9B59A5" },
    chipBg: { light: "rgba(74,21,75,0.08)", dark: "rgba(155,89,165,0.12)" },
    badge: {
      dark: "bg-[#9B59A5]/15 text-[#9B59A5] ring-1 ring-[#9B59A5]/25",
      light: "bg-[#4A154B]/10 text-[#4A154B] ring-1 ring-[#4A154B]/20",
    },
    dot: {
      dark: "bg-[#9B59A5] shadow-[0_0_8px_rgba(155,89,165,0.5)]",
      light: "bg-[#4A154B]",
    },
  },
  GMAIL: {
    label: "Gmail",
    Svg: GmailSvg,
    iconColor: { light: "#D93025", dark: "#E05545" },
    chipBg: { light: "rgba(217,48,37,0.08)", dark: "rgba(224,85,69,0.12)" },
    badge: {
      dark: "bg-[#E05545]/15 text-[#E05545] ring-1 ring-[#E05545]/25",
      light: "bg-[#D93025]/10 text-[#D93025] ring-1 ring-[#D93025]/20",
    },
    dot: {
      dark: "bg-[#E05545] shadow-[0_0_8px_rgba(224,85,69,0.5)]",
      light: "bg-[#D93025]",
    },
  },
  JIRA: {
    label: "Jira",
    Svg: JiraSvg,
    iconColor: { light: "#0052CC", dark: "#4C9AFF" },
    chipBg: { light: "rgba(0,82,204,0.08)", dark: "rgba(76,154,255,0.12)" },
    badge: {
      dark: "bg-[#4C9AFF]/15 text-[#4C9AFF] ring-1 ring-[#4C9AFF]/25",
      light: "bg-[#0052CC]/10 text-[#0052CC] ring-1 ring-[#0052CC]/20",
    },
    dot: {
      dark: "bg-[#4C9AFF] shadow-[0_0_8px_rgba(76,154,255,0.5)]",
      light: "bg-[#0052CC]",
    },
  },
  TRELLO: {
    label: "Trello",
    Svg: TrelloSvg,
    iconColor: { light: "#0079BF", dark: "#00C2E0" },
    chipBg: { light: "rgba(0,121,191,0.08)", dark: "rgba(0,194,224,0.12)" },
    badge: {
      dark: "bg-[#00C2E0]/15 text-[#00C2E0] ring-1 ring-[#00C2E0]/25",
      light: "bg-[#0079BF]/10 text-[#0079BF] ring-1 ring-[#0079BF]/20",
    },
    dot: {
      dark: "bg-[#00C2E0] shadow-[0_0_8px_rgba(0,194,224,0.5)]",
      light: "bg-[#0079BF]",
    },
  },
  ASANA: {
    label: "Asana",
    Svg: AsanaSvg,
    iconColor: { light: "#F06A6A", dark: "#F07A7A" },
    chipBg: { light: "rgba(240,106,106,0.08)", dark: "rgba(240,122,122,0.12)" },
    badge: {
      dark: "bg-[#F07A7A]/15 text-[#F07A7A] ring-1 ring-[#F07A7A]/25",
      light: "bg-[#F06A6A]/10 text-[#F06A6A] ring-1 ring-[#F06A6A]/20",
    },
    dot: {
      dark: "bg-[#F07A7A] shadow-[0_0_8px_rgba(240,122,122,0.5)]",
      light: "bg-[#F06A6A]",
    },
  },
  MANUAL: {
    label: "Manual",
    Svg: ({ className, style }) => (
      <Pencil className={className} style={style} />
    ),
    iconColor: { light: "#71717a", dark: "#a1a1aa" },
    chipBg: { light: "rgba(113,113,122,0.08)", dark: "rgba(161,161,170,0.1)" },
    badge: {
      dark: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
      light: "bg-zinc-400/10 text-zinc-600 ring-1 ring-zinc-400/20",
    },
    dot: {
      dark: "bg-zinc-500",
      light: "bg-zinc-500",
    },
  },
};

// =============================================================
// PLATFORM ICON CHIP
// 16×16 rounded square with brand SVG inside.
// Stacks with -space-x-1.5 like the old dots.
// Use this on task cards, drawer cards, note chips.
//
// Dark mode color: passed via CSS custom property on the element
// so Tailwind's dark: variant isn't needed in the SVG component.
// =============================================================

export function PlatformIcon({
  platform,
  size = "md",
}: {
  platform: Platform;
  size?: "sm" | "md";
}) {
  const c = CONFIG[platform];
  const { Svg } = c;

  // sm = 14px chip / 8px icon  (source timeline dot replacement)
  // md = 16px chip / 9px icon  (task card row)
  const chip = size === "sm" ? "h-3.5 w-3.5 rounded" : "h-4 w-4 rounded";
  const icon = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span
      title={c.label}
      className={`
        platform-icon
        inline-flex shrink-0 items-center justify-center
        ${chip}
        ring-[1.5px] ring-white dark:ring-zinc-800
        bg-white dark:bg-zinc-900
      `}
      style={{
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        // Pass brand colors as CSS vars — picked up by the SVG via currentColor
        ["--platform-color-light" as string]: c.iconColor.light,
        ["--platform-color-dark" as string]: c.iconColor.dark,
      }}
    >
      {/*
        SVG color: light mode uses --platform-color-light,
        dark mode uses --platform-color-dark.
        The globals.css adds:
          .platform-icon svg { color: var(--platform-color-light); }
          .dark .platform-icon svg { color: var(--platform-color-dark); }
      */}
      <Svg className={icon} />
    </span>
  );
}

// =============================================================
// PLATFORM BADGE
// Text + icon pill used in the source timeline header.
// Now uses real brand SVG instead of lucide approximation.
// =============================================================

export function PlatformBadge({
  platform,
  theme = "dark",
}: {
  platform: Platform;
  theme?: "dark" | "light";
}) {
  const c = CONFIG[platform];
  const { Svg } = c;
  const s = theme === "dark" ? c.badge.dark : c.badge.light;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s}`}
    >
      <Svg className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

// =============================================================
// PLATFORM DOT
// Kept for the source timeline vertical connector dot only.
// All task card usage should migrate to PlatformIcon.
// =============================================================

export function PlatformDot({
  platform,
  theme = "dark",
}: {
  platform: Platform;
  theme?: "dark" | "light";
}) {
  const c = CONFIG[platform];
  const s = theme === "dark" ? c.dot.dark : c.dot.light;
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white/10 dark:ring-[#0a0a0f]/80 ${s}`}
    />
  );
}

// =============================================================
// HELPERS — kept for backward compat (source-timeline uses these)
// =============================================================

export function getPlatformDotClass(
  platform: Platform,
  theme: "dark" | "light" = "dark",
): string {
  const c = CONFIG[platform];
  return theme === "dark" ? c.dot.dark : c.dot.light;
}

export function getPlatformFilterStyle(platform: Platform): { active: string } {
  const map: Record<string, string> = {
    SLACK: "bg-[#9B59A5]/15 text-[#9B59A5] ring-1 ring-[#9B59A5]/30",
    GMAIL: "bg-[#E05545]/15 text-[#E05545] ring-1 ring-[#E05545]/30",
    JIRA: "bg-[#4C9AFF]/15 text-[#4C9AFF] ring-1 ring-[#4C9AFF]/30",
    TRELLO: "bg-[#00C2E0]/15 text-[#00C2E0] ring-1 ring-[#00C2E0]/30",
    ASANA: "bg-[#F07A7A]/15 text-[#F07A7A] ring-1 ring-[#F07A7A]/30",
  };
  return {
    active:
      map[platform] ?? "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30",
  };
}
