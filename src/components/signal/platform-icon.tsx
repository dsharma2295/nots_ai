"use client";

import type { Platform } from "@/lib/mock-data";
import { Diamond, Hash, LayoutGrid, Mail, Pencil, Target } from "lucide-react";

// =============================================================
// OFFICIAL BRAND COLORS (desaturated for dark mode readability)
//
// Slack:  Aubergine #4A154B → dark: #9B59A5 / light: #4A154B
// Gmail:  Google Red #EA4335 → dark: #E05545 / light: #D93025
// Jira:   Atlassian Blue #0052CC → dark: #4C9AFF / light: #0052CC
// Trello: Teal #00C2E0 → dark: #00C2E0 / light: #0079BF
// Asana:  Coral #F06A6A → dark: #F07A7A / light: #F06A6A
// =============================================================

const CONFIG: Record<
  Platform,
  {
    label: string;
    Icon: typeof Hash;
    dark: { badge: string; dot: string };
    light: { badge: string; dot: string };
  }
> = {
  SLACK: {
    label: "Slack",
    Icon: Hash,
    dark: {
      badge: "bg-[#9B59A5]/15 text-[#9B59A5] ring-1 ring-[#9B59A5]/25",
      dot: "bg-[#9B59A5] shadow-[0_0_8px_rgba(155,89,165,0.5)]",
    },
    light: {
      badge: "bg-[#4A154B]/10 text-[#4A154B] ring-1 ring-[#4A154B]/20",
      dot: "bg-[#4A154B]",
    },
  },
  GMAIL: {
    label: "Gmail",
    Icon: Mail,
    dark: {
      badge: "bg-[#E05545]/15 text-[#E05545] ring-1 ring-[#E05545]/25",
      dot: "bg-[#E05545] shadow-[0_0_8px_rgba(224,85,69,0.5)]",
    },
    light: {
      badge: "bg-[#D93025]/10 text-[#D93025] ring-1 ring-[#D93025]/20",
      dot: "bg-[#D93025]",
    },
  },
  JIRA: {
    label: "Jira",
    Icon: Diamond,
    dark: {
      badge: "bg-[#4C9AFF]/15 text-[#4C9AFF] ring-1 ring-[#4C9AFF]/25",
      dot: "bg-[#4C9AFF] shadow-[0_0_8px_rgba(76,154,255,0.5)]",
    },
    light: {
      badge: "bg-[#0052CC]/10 text-[#0052CC] ring-1 ring-[#0052CC]/20",
      dot: "bg-[#0052CC]",
    },
  },
  TRELLO: {
    label: "Trello",
    Icon: LayoutGrid,
    dark: {
      badge: "bg-[#00C2E0]/15 text-[#00C2E0] ring-1 ring-[#00C2E0]/25",
      dot: "bg-[#00C2E0] shadow-[0_0_8px_rgba(0,194,224,0.5)]",
    },
    light: {
      badge: "bg-[#0079BF]/10 text-[#0079BF] ring-1 ring-[#0079BF]/20",
      dot: "bg-[#0079BF]",
    },
  },
  ASANA: {
    label: "Asana",
    Icon: Target,
    dark: {
      badge: "bg-[#F07A7A]/15 text-[#F07A7A] ring-1 ring-[#F07A7A]/25",
      dot: "bg-[#F07A7A] shadow-[0_0_8px_rgba(240,122,122,0.5)]",
    },
    light: {
      badge: "bg-[#F06A6A]/10 text-[#F06A6A] ring-1 ring-[#F06A6A]/20",
      dot: "bg-[#F06A6A]",
    },
  },
  MANUAL: {
    label: "Manual",
    Icon: Pencil,
    dark: {
      badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
      dot: "bg-zinc-500",
    },
    light: {
      badge: "bg-zinc-400/10 text-zinc-600 ring-1 ring-zinc-400/20",
      dot: "bg-zinc-500",
    },
  },
};

export function PlatformBadge({
  platform,
  theme = "dark",
}: {
  platform: Platform;
  theme?: "dark" | "light";
}) {
  const c = CONFIG[platform];
  const IconComp = c.Icon;
  const s = theme === "dark" ? c.dark : c.light;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.badge}`}
    >
      <IconComp className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

export function PlatformDot({
  platform,
  theme = "dark",
}: {
  platform: Platform;
  theme?: "dark" | "light";
}) {
  const c = CONFIG[platform];
  const s = theme === "dark" ? c.dark : c.light;
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white/10 dark:ring-[#0a0a0f]/80 ${s.dot}`}
    />
  );
}

export function getPlatformDotClass(
  platform: Platform,
  theme: "dark" | "light" = "dark",
): string {
  const c = CONFIG[platform];
  return theme === "dark" ? c.dark.dot : c.light.dot;
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
