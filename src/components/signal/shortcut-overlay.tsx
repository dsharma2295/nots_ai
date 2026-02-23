"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

// =============================================================
// Shortcut groups
// =============================================================

const GROUPS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑"], label: "Previous card" },
      { keys: ["↓"], label: "Next card" },
      { keys: ["←"], label: "Previous column" },
      { keys: ["→"], label: "Next column" },
      { keys: ["Enter"], label: "Expand / collapse" },
      { keys: ["Esc"], label: "Clear focus" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["D"], label: "Mark done" },
      { keys: ["B"], label: "Bookmark" },
      { keys: ["N"], label: "Add note" },
      { keys: ["T"], label: "Trash" },
      { keys: ["1"], label: "Set P1 (Gold)" },
      { keys: ["2"], label: "Set P2 (Silver)" },
      { keys: ["3"], label: "Set P3 (Bronze)" },
      { keys: ["0"], label: "Clear tier" },
    ],
  },
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], label: "Search" },
      { keys: ["/"], label: "AI mode" },
      { keys: ["R"], label: "Toggle resolved" },
      { keys: ["X"], label: "Toggle trash" },
      { keys: ["Esc"], label: "Clear focus / close" },
      { keys: ["?"], label: "This overlay" },
    ],
  },
];

// =============================================================
// Key badge
// =============================================================

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-zinc-200 bg-white px-1.5 text-[11px] font-semibold text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
      {children}
    </kbd>
  );
}

// =============================================================
// Overlay
// =============================================================

export function ShortcutOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm dark:bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-700 dark:bg-zinc-900/95"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                Keyboard shortcuts
              </h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600 active:scale-90 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <span className="text-[14px]">✕</span>
              </button>
            </div>

            {/* Entry instruction */}
            <div className="mb-5 rounded-lg bg-indigo-50 px-3 py-2 dark:bg-indigo-500/10">
              <p className="text-[12px] text-indigo-700 dark:text-indigo-300">
                Press any <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge>{" "}
                <KeyBadge>←</KeyBadge> <KeyBadge>→</KeyBadge> arrow key to
                select the first card, then navigate and act.
              </p>
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-3 gap-5">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                    {group.title}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.label}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      >
                        <span className="text-[12px] text-zinc-600 dark:text-zinc-400">
                          {shortcut.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <span className="text-[9px] text-zinc-300 dark:text-zinc-500">
                                  +
                                </span>
                              )}
                              <KeyBadge>{key}</KeyBadge>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
              <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                Press <KeyBadge>?</KeyBadge> to toggle this overlay
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
