"use client";

import { GmailSvg, SlackSvg } from "@/components/platform-icon";
import { DEFAULT_CARD, TIER_STYLE } from "@/features/task-card/tier-config";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Medal,
  NotebookPen,
  Paperclip,
  Trash2,
} from "lucide-react";
import React, { useRef, useState } from "react";

interface Annotation {
  label: string;
  description: string;
}

const ANNOTATIONS: Record<string, Annotation> = {
  status: {
    label: "Status",
    description:
      "Current state — Open, Active, Blocked, or Done. Updates as you work the task.",
  },
  tier: {
    label: "Priority Tier",
    description:
      "P1 Gold · P2 Silver · P3 Bronze. Set manually to boost visual prominence in the kanban.",
  },
  bookmark: {
    label: "Bookmark",
    description:
      "Pin to Bookmarks view for quick access without affecting priority.",
  },
  notes: {
    label: "Notes",
    description:
      "Personal notes attached to this task. The number shows how many you've written.",
  },
  attachments: {
    label: "Attachments",
    description:
      "Files detected in the source messages — click to open in the original platform.",
  },
  review: {
    label: "Needs Review",
    description:
      "AI grouping confidence was under 70%. Verify the task is correctly formed before acting.",
  },
  unread: {
    label: "Unread",
    description:
      "New messages arrived since you last opened this task. Number shows how many.",
  },
  title: {
    label: "Smart Title",
    description:
      "AI-generated 3–15 word summary of the core action, based on what was actually said.",
  },
  platforms: {
    label: "Source Platforms",
    description:
      "Every platform this task aggregated messages from. One card can span many sources.",
  },
  msgcount: {
    label: "Message Count",
    description:
      "Total raw messages merged into this single card by the AI pipeline.",
  },
  intent: {
    label: "Intent Tag",
    description:
      "AI-classified communication type — document-review, meeting-request, bug-fix, and so on.",
  },
  done: {
    label: "Mark Done",
    description:
      "Resolve the task. Moves it to the Resolved drawer. Undoable within the session.",
  },
  move: {
    label: "Move Column",
    description:
      "Reassign priority — shifts the card to Urgent, Normal, or Low Priority.",
  },
  settier: {
    label: "Set Tier",
    description:
      "Manually pin a P1/P2/P3 badge. Changes the card border colour and background gradient.",
  },
  delete: {
    label: "Delete",
    description:
      "Soft delete — moves to Trash. Recoverable for 30 days before permanent removal.",
  },
  notechip: {
    label: "Note Preview",
    description:
      "Inline chip showing one of your notes. Click to read or edit it.",
  },
  provenance: {
    label: "Provenance",
    description:
      "Full audit trail of every message that formed this task. Immutable record of context.",
  },
  platform: {
    label: "Platform Badge",
    description: "Which integration this specific message came from.",
  },
  sender: {
    label: "Sender",
    description:
      "Who sent the original message — resolved to their display name.",
  },
  openlink: {
    label: "Deep Link",
    description:
      "Jump directly to the original message in Slack, Gmail, or Jira.",
  },
};

interface PopoverState {
  key: string;
  rect: DOMRect;
  containerRect: DOMRect;
}

function Ann({
  id,
  children,
  onShow,
  onHide,
  containerRef,
  inline = false,
}: {
  id: string;
  children: React.ReactNode;
  onShow: (s: PopoverState) => void;
  onHide: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  inline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = inline ? "span" : "div";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLSpanElement>}
      onMouseEnter={() => {
        // Reading refs in event handlers is always safe
        const el = ref.current;
        const container = containerRef.current;
        if (el && container) {
          onShow({
            key: id,
            rect: el.getBoundingClientRect(),
            containerRect: container.getBoundingClientRect(),
          });
        }
      }}
      onMouseLeave={onHide}
      className="cursor-default rounded transition-colors duration-100 hover:bg-indigo-50/80 hover:ring-1 hover:ring-inset hover:ring-indigo-300/70 dark:hover:bg-indigo-500/10 dark:hover:ring-indigo-500/30"
    >
      {children}
    </Tag>
  );
}

function Popover({ state }: { state: PopoverState }) {
  const ann = ANNOTATIONS[state.key];
  if (!ann) return null;
  const containerRect = state.containerRect;

  const relTop = state.rect.top - containerRect.top;
  const relBottom = state.rect.bottom - containerRect.top;
  const showAbove = relTop > 80;
  const POPOVER_W = 224;
  const idealLeft =
    state.rect.left - containerRect.left + state.rect.width / 2 - POPOVER_W / 2;
  const left = Math.max(
    4,
    Math.min(idealLeft, containerRect.width - POPOVER_W - 4),
  );

  return (
    <motion.div
      key={state.key}
      initial={{ opacity: 0, y: showAbove ? 6 : -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.13, ease: "easeOut" }}
      style={{
        position: "absolute",
        ...(showAbove
          ? { bottom: containerRect.height - relTop + 8 }
          : { top: relBottom + 8 }),
        left,
        width: POPOVER_W,
        zIndex: 50,
        pointerEvents: "none",
      }}
      className="rounded-xl border border-indigo-200/70 bg-white px-3.5 py-2.5 shadow-xl shadow-indigo-100/40 dark:border-indigo-500/25 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <p className="text-[12px] font-semibold text-indigo-700 dark:text-indigo-300">
        {ann.label}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        {ann.description}
      </p>
    </motion.div>
  );
}

function StencilCard({
  tier,
  onShow,
  onHide,
  containerRef,
}: {
  tier: number;
  onShow: (s: PopoverState) => void;
  onHide: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const tierStyle = tier > 0 ? TIER_STYLE[tier] : null;
  const cardClass = tierStyle ? tierStyle.card : DEFAULT_CARD;

  return (
    <div className={`relative rounded-xl border shadow-sm ${cardClass}`}>
      {/* iPhone-style badge — absolute top-right corner */}
      <Ann
        id="unread"
        onShow={onShow}
        onHide={onHide}
        containerRef={containerRef}
        inline
      >
        <span className="absolute -right-2 -top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_#18181b]">
          3
        </span>
      </Ann>
      <div className="px-4 py-3.5">
        {/* Row 1 */}
        <div className="mb-2 flex items-center gap-2">
          <Ann
            id="status"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open
            </span>
          </Ann>

          {tierStyle && (
            <Ann
              id="tier"
              onShow={onShow}
              onHide={onHide}
              containerRef={containerRef}
              inline
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${tierStyle.badge}`}
              >
                {tierStyle.label}
              </span>
            </Ann>
          )}

          <Ann
            id="bookmark"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <Bookmark className="h-3 w-3 fill-blue-500 text-blue-500" />
          </Ann>

          <Ann
            id="notes"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="flex items-center gap-1">
              <NotebookPen className="h-3 w-3 text-indigo-500" />
              <span className="text-[11px] font-medium text-indigo-500">2</span>
            </span>
          </Ann>

          <Ann
            id="attachments"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
              <Paperclip className="h-3 w-3" />1
            </span>
          </Ann>

          <Ann
            id="review"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Review
            </span>
          </Ann>
        </div>

        {/* Row 2: Title */}
        <Ann
          id="title"
          onShow={onShow}
          onHide={onHide}
          containerRef={containerRef}
        >
          <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
            Review Q3 Budget Deck by Friday
          </h3>
        </Ann>

        {/* Row 3 */}
        <div className="flex items-center gap-2.5">
          <Ann
            id="platforms"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="flex -space-x-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-white ring-[1.5px] ring-white dark:bg-zinc-900 dark:ring-zinc-800">
                <SlackSvg
                  className="h-2.5 w-2.5"
                  style={{ color: "#4A154B" }}
                />
              </span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-white ring-[1.5px] ring-white dark:bg-zinc-900 dark:ring-zinc-800">
                <GmailSvg
                  className="h-2.5 w-2.5"
                  style={{ color: "#D93025" }}
                />
              </span>
            </span>
          </Ann>

          <Ann
            id="msgcount"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              3 messages
            </span>
          </Ann>

          <Ann
            id="intent"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
              document-review
            </span>
          </Ann>

          <div className="ml-auto flex items-center gap-0.5">
            <Ann
              id="done"
              onShow={onShow}
              onHide={onHide}
              containerRef={containerRef}
              inline
            >
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
              </button>
            </Ann>
            <Ann
              id="move"
              onShow={onShow}
              onHide={onHide}
              containerRef={containerRef}
              inline
            >
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
            </Ann>
            <Ann
              id="settier"
              onShow={onShow}
              onHide={onHide}
              containerRef={containerRef}
              inline
            >
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400">
                <Medal className="h-3.5 w-3.5" />
              </button>
            </Ann>
            <Ann
              id="delete"
              onShow={onShow}
              onHide={onHide}
              containerRef={containerRef}
              inline
            >
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Ann>
          </div>
        </div>
      </div>

      {/* Note chip */}
      <div className="border-t border-zinc-100 px-4 pb-0 pt-3 dark:border-zinc-800/50">
        <Ann
          id="notechip"
          onShow={onShow}
          onHide={onHide}
          containerRef={containerRef}
          inline
        >
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-white/3 dark:text-zinc-400 dark:ring-zinc-700/50">
            <NotebookPen className="h-2.5 w-2.5 text-indigo-400" />
            Check slide 7 numbers with Finance
          </button>
        </Ann>
      </div>

      {/* Provenance */}
      <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800/50">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
          <Ann
            id="provenance"
            onShow={onShow}
            onHide={onHide}
            containerRef={containerRef}
            inline
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Provenance
            </span>
          </Ann>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
        </div>

        <div className="relative ml-1 pl-5">
          <div className="absolute bottom-5 left-1.5 top-5.75 w-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Event 1 */}
          <div className="relative mb-3">
            <div className="absolute -left-4.75 top-4.5 h-2.5 w-2.5 rounded-full bg-[#4A154B] ring-[3px] ring-white dark:ring-zinc-800" />
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800/50 dark:bg-[#0f0f18]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Ann
                  id="platform"
                  onShow={onShow}
                  onHide={onHide}
                  containerRef={containerRef}
                  inline
                >
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#4A154B]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4A154B] ring-1 ring-[#4A154B]/20">
                    <SlackSvg className="h-2.5 w-2.5" />
                    Slack
                  </span>
                </Ann>
                <Ann
                  id="sender"
                  onShow={onShow}
                  onHide={onHide}
                  containerRef={containerRef}
                  inline
                >
                  <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                    Sarah Chen
                  </span>
                </Ann>
                <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                  Feb 7, 9:15 AM
                </span>
              </div>
              <p className="text-[13px] leading-[1.6] text-zinc-600 dark:text-zinc-400">
                Hey team, can someone review the Q3 budget deck by Friday?
                I&apos;ve attached the latest numbers and we need sign-off
                before the board meeting.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-zinc-700/30">
                  <Paperclip className="h-3 w-3 opacity-50" />
                  Q3_Budget_v3.xlsx
                </span>
              </div>
              <div className="mt-2.5">
                <Ann
                  id="openlink"
                  onShow={onShow}
                  onHide={onHide}
                  containerRef={containerRef}
                  inline
                >
                  <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-500">
                    Open in Slack
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Ann>
              </div>
            </div>
          </div>

          {/* Event 2 */}
          <div className="relative">
            <div className="absolute -left-4.75 top-4.5 h-2.5 w-2.5 rounded-full bg-[#D93025] ring-[3px] ring-white dark:ring-zinc-800" />
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800/50 dark:bg-[#0f0f18]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#D93025]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#D93025] ring-1 ring-[#D93025]/20">
                  <GmailSvg className="h-2.5 w-2.5" />
                  Gmail
                </span>
                <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                  Marcus Liu
                </span>
                <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                  Feb 7, 11:42 AM
                </span>
              </div>
              <p className="text-[13px] leading-[1.6] text-zinc-600 dark:text-zinc-400">
                RE: Q3 Budget — I&apos;ve added revised numbers for APAC. Please
                check slide 7 before circulating.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskCardStencil() {
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [tier, setTier] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const TIER_TABS = [
    { value: 0, label: "Default" },
    { value: 1, label: "P1 Gold" },
    { value: 2, label: "P2 Silver" },
    { value: 3, label: "P3 Bronze" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
          Hover any element on the card to learn what it does.
        </p>
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          {TIER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTier(t.value);
                setPopover(null);
              }}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                tier === t.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card + floating popover */}
      <div ref={containerRef} className="relative">
        <StencilCard
          tier={tier}
          onShow={setPopover}
          onHide={() => setPopover(null)}
          containerRef={containerRef}
        />
        <AnimatePresence>
          {popover && <Popover key={popover.key} state={popover} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
