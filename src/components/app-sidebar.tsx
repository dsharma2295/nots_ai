"use client";

import { motion } from "framer-motion";
import {
  Archive,
  BarChart2,
  Bookmark,
  LayoutGrid,
  Settings,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

// Lazy-load heavy modals so a compile error inside them
// cannot crash the sidebar render.
const SettingsModal = dynamic(
  () => import("@/components/settings-modal").then((m) => m.SettingsModal),
  { ssr: false },
);

const AnalyticsModal = dynamic(
  () => import("@/components/analytics-modal").then((m) => m.AnalyticsModal),
  { ssr: false },
);

// =============================================================
// FUNNEL LOGO MARK
// =============================================================
function FunnelMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 5h18L17 10H7L3 5z"
        fill="currentColor"
        opacity={0.2}
        className="text-zinc-800 dark:text-white"
      />
      <rect
        x="8"
        y="11"
        width="8"
        height="4"
        rx="1"
        fill="currentColor"
        opacity={0.55}
        className="text-zinc-800 dark:text-white"
      />
      <circle
        cx="12"
        cy="19"
        r="2"
        fill="currentColor"
        opacity={1}
        className="text-zinc-800 dark:text-white"
      />
    </svg>
  );
}

// =============================================================
// SIDEBAR ITEM
// =============================================================
function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  href,
}: {
  icon: typeof LayoutGrid;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <motion.div
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }`}
      whileTap={{ scale: 0.92 }}
    >
      <Icon className="h-4 w-4" />
    </motion.div>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {href ? (
        <Link href={href} className="block">
          {inner}
        </Link>
      ) : (
        <button onClick={onClick} className="block">
          {inner}
        </button>
      )}

      {hovered && (
        <motion.div
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.1 }}
        >
          <div className="whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {label}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// =============================================================
// APP SIDEBAR
// =============================================================
export function AppSidebar({
  activeView = "dashboard",
}: {
  activeView?: "dashboard" | "bookmarks";
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  function openResolved() {
    window.dispatchEvent(new CustomEvent("nots:openResolved"));
  }
  function openTrash() {
    window.dispatchEvent(new CustomEvent("nots:openTrash"));
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 top-0 z-40 flex w-14 flex-col items-center border-r border-zinc-200 bg-white/90 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        {/* Logo */}
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <FunnelMark />
        </div>

        {/* Divider */}
        <div className="mb-3 h-px w-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Primary nav */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <SidebarItem
            icon={LayoutGrid}
            label="Dashboard"
            active={activeView === "dashboard"}
            href="/"
          />
          <SidebarItem
            icon={Bookmark}
            label="Bookmarks"
            active={activeView === "bookmarks"}
            href="/bookmarks"
          />
          <SidebarItem icon={Archive} label="Resolved" onClick={openResolved} />
          <SidebarItem icon={Trash2} label="Trash" onClick={openTrash} />
        </div>

        {/* Bottom — analytics + settings */}
        <div className="flex flex-col items-center gap-1.5">
          <SidebarItem
            icon={BarChart2}
            label="Analytics"
            onClick={() => setAnalyticsOpen(true)}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            onClick={() => setSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Modals — lazy loaded so errors inside them don't crash the sidebar */}
      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {analyticsOpen && (
        <AnalyticsModal
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}
    </>
  );
}
