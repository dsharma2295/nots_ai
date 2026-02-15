"use client";

import type { Platform } from "@/lib/mock-data";
import { Diamond, Hash, LayoutGrid, Mail, Pencil, Target } from "lucide-react";

const CONFIG: Record<
  Platform,
  {
    label: string;
    Icon: typeof Hash;
    badge: string;
    dot: string;
    glow: string;
  }
> = {
  SLACK: {
    label: "Slack",
    Icon: Hash,
    badge: "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
    dot: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]",
    glow: "purple",
  },
  GMAIL: {
    label: "Gmail",
    Icon: Mail,
    badge: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
    dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]",
    glow: "red",
  },
  JIRA: {
    label: "Jira",
    Icon: Diamond,
    badge: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
    dot: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]",
    glow: "blue",
  },
  TRELLO: {
    label: "Trello",
    Icon: LayoutGrid,
    badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    dot: "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.4)]",
    glow: "sky",
  },
  ASANA: {
    label: "Asana",
    Icon: Target,
    badge: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
    dot: "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]",
    glow: "orange",
  },
  MANUAL: {
    label: "Manual",
    Icon: Pencil,
    badge: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
    dot: "bg-zinc-500",
    glow: "zinc",
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const c = CONFIG[platform];
  const IconComp = c.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.badge}`}
    >
      <IconComp className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

export function PlatformDot({ platform }: { platform: Platform }) {
  const c = CONFIG[platform];
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-[#0a0a0f] ${c.dot}`}
    />
  );
}

export function getPlatformDotColor(platform: Platform): string {
  return CONFIG[platform]?.dot ?? "bg-zinc-500";
}
