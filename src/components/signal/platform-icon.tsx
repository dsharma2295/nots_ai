"use client";

import type { Platform } from "@/lib/mock-data";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; bg: string; icon: string }
> = {
  SLACK: {
    label: "Slack",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: "#",
  },
  GMAIL: { label: "Gmail", color: "text-red-700", bg: "bg-red-100", icon: "✉" },
  JIRA: { label: "Jira", color: "text-blue-700", bg: "bg-blue-100", icon: "◆" },
  TRELLO: {
    label: "Trello",
    color: "text-sky-700",
    bg: "bg-sky-100",
    icon: "▦",
  },
  ASANA: {
    label: "Asana",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: "◎",
  },
  MANUAL: {
    label: "Manual",
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: "✎",
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
    >
      <span>{config.icon}</span>
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
    MANUAL: "bg-gray-500",
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colorMap[platform]}`}
    />
  );
}
