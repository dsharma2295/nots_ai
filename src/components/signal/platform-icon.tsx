"use client";

import type { Platform } from "@/lib/mock-data";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; icon: string }
> = {
  SLACK: {
    label: "Slack",
    color: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/20",
    icon: "#",
  },
  GMAIL: {
    label: "Gmail",
    color: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20",
    icon: "✉",
  },
  JIRA: {
    label: "Jira",
    color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
    icon: "◆",
  },
  TRELLO: {
    label: "Trello",
    color: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20",
    icon: "▦",
  },
  ASANA: {
    label: "Asana",
    color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20",
    icon: "◎",
  },
  MANUAL: {
    label: "Manual",
    color: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/20",
    icon: "✎",
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}
    >
      <span className="opacity-70">{config.icon}</span>
      {config.label}
    </span>
  );
}

export function PlatformDot({ platform }: { platform: Platform }) {
  const colorMap: Record<Platform, string> = {
    SLACK: "bg-purple-500",
    GMAIL: "bg-red-500",
    JIRA: "bg-blue-500",
    TRELLO: "bg-sky-500",
    ASANA: "bg-orange-500",
    MANUAL: "bg-zinc-500",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colorMap[platform]}`}
    />
  );
}
