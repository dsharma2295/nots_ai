"use client";

import { TIER_STYLE } from "@/features/task-card/tier-config";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// =============================================================
// TYPES
// =============================================================

interface QuickAddValues {
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  tier: number;
  notes: string;
}

const PRIORITY_OPTIONS: {
  value: QuickAddValues["priority"];
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "CRITICAL",
    label: "Urgent",
    color: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  {
    value: "HIGH",
    label: "High",
    color: "text-orange-500 dark:text-orange-400",
    dot: "bg-orange-400",
  },
  {
    value: "MEDIUM",
    label: "Normal",
    color: "text-blue-500 dark:text-blue-400",
    dot: "bg-blue-400",
  },
  {
    value: "LOW",
    label: "Low Priority",
    color: "text-zinc-400 dark:text-zinc-500",
    dot: "bg-zinc-300 dark:bg-zinc-600",
  },
];

const TIER_OPTIONS = [
  { value: 0, label: "No tier" },
  { value: 1, label: "P1 Gold" },
  { value: 2, label: "P2 Silver" },
  { value: 3, label: "P3 Bronze" },
];

// =============================================================
// QUICK ADD MODAL
// =============================================================

export function QuickAddModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (values: QuickAddValues) => void;
}): React.ReactElement | null {
  const [title, setTitle] = useState("");
  const [priority, setPriority] =
    useState<QuickAddValues["priority"]>("MEDIUM");
  const [tier, setTier] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setPriority("MEDIUM");
      setTier(0);
      setNotes("");
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, priority, tier, notes]);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) {
      titleRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await onCreate({ title: trimmed, priority, tier, notes: notes.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const tierStyle = tier > 0 ? TIER_STYLE[tier] : null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center pb-12 sm:items-center sm:pb-0">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tier accent bar */}
            <div
              className={`h-1 w-full transition-all duration-300 ${
                tier === 1
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                  : tier === 2
                    ? "bg-gradient-to-r from-slate-400 to-slate-300"
                    : tier === 3
                      ? "bg-gradient-to-r from-amber-700 to-amber-600"
                      : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            />

            <div className="px-5 pb-5 pt-4">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
                  New task
                </span>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="mb-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[14px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
              />

              {/* Priority + Tier row */}
              <div className="mb-4 flex gap-2">
                {/* Priority */}
                <div className="flex-1">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                    Priority
                  </p>
                  <div className="flex gap-1">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPriority(opt.value)}
                        className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all active:scale-95 ${
                          priority === opt.value
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : `${opt.color} hover:bg-zinc-50 dark:hover:bg-zinc-800/60`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tier */}
              <div className="mb-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Emphasis tier
                </p>
                <div className="flex gap-1">
                  {TIER_OPTIONS.map((opt) => {
                    const ts = opt.value > 0 ? TIER_STYLE[opt.value] : null;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTier(opt.value)}
                        className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all active:scale-95 ${
                          tier === opt.value
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        {ts ? (
                          <span
                            className={`rounded px-1 text-[9px] font-bold ${ts.badge}`}
                          >
                            {ts.label}
                          </span>
                        ) : (
                          opt.label
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Notes{" "}
                  <span className="font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context, links, or details..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-700 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[12px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:text-zinc-700 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || loading}
                  className="flex-[2] rounded-xl bg-zinc-900 py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  {loading ? "Creating…" : "Create task"}
                </button>
              </div>

              <p className="mt-2.5 text-center text-[10px] text-zinc-400 dark:text-zinc-600">
                ⌘↵ to create
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
