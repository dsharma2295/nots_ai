"use client";

import type { Platform } from "@/lib/mock-data";
import { Diamond, Hash, LayoutGrid, Mail, Pencil, Target } from "lucide-react";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; Icon: typeof Hash; dotColor: string }
> = {
  SLACK: {
    label: "Slack",
    color: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    Icon: Hash,
    dotColor: "bg-purple-500",
  },
  GMAIL: {
    label: "Gmail",
    color: "bg-red-500/10 text-red-400 border border-red-500/20",
    Icon: Mail,
    dotColor: "bg-red-500",
  },
  JIRA: {
    label: "Jira",
    color: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Icon: Diamond,
    dotColor: "bg-blue-500",
  },
  TRELLO: {
    label: "Trello",
    color: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    Icon: LayoutGrid,
    dotColor: "bg-sky-500",
  },
  ASANA: {
    label: "Asana",
    color: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    Icon: Target,
    dotColor: "bg-orange-500",
  },
  MANUAL: {
    label: "Manual",
    color: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    Icon: Pencil,
    dotColor: "bg-zinc-500",
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  const IconComp = config.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${config.color}`}
    >
      <IconComp className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

export function PlatformDot({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ring-2 ring-zinc-900 ${config.dotColor}`}
    />
  );
}

export function getPlatformDotColor(platform: Platform): string {
  return PLATFORM_CONFIG[platform]?.dotColor ?? "bg-zinc-500";
}
