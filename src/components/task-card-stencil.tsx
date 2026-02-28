"use client";

// =============================================================
// TaskCardStencil — Settings "Card Anatomy" Tab
//
// Renders a pixel-accurate replica of the task card in its
// hover+expanded+provenance state. Numbered annotation markers
// appear on each UI element. Hovering either a marker or its
// label in the legend highlights both — connecting the visual
// to the explanation.
// =============================================================

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
import { useState } from "react";

// =============================================================
// ANNOTATION DEFINITIONS
// Each has an id, label, and description.
// =============================================================

const ANNOTATIONS = [
  {
    id: 1,
    label: "Status dot",
    description: "Green = Open · Blue = Active · Red = Blocked",
  },
  {
    id: 2,
    label: "Priority tier",
    description:
      "P1 Gold · P2 Silver · P3 Bronze — set manually to boost visibility",
  },
  {
    id: 3,
    label: "Bookmark",
    description: "Save for quick access in the Bookmarks view",
  },
  {
    id: 4,
    label: "Notes",
    description: "Personal notes attached to this task — visible only to you",
  },
  {
    id: 5,
    label: "Attachments",
    description: "Files detected in the source messages",
  },
  {
    id: 6,
    label: "Review flag",
    description: "AI confidence < 70% — the grouping needs your confirmation",
  },
  {
    id: 7,
    label: "Unread badge",
    description: "New messages arrived since you last opened this task",
  },
  {
    id: 8,
    label: "Smart title",
    description: "AI-generated 3–15 word summary of the core action needed",
  },
  {
    id: 9,
    label: "Source icons",
    description: "Platforms this task aggregated messages from",
  },
  {
    id: 10,
    label: "Message count",
    description: "Total raw messages merged into this single task",
  },
  {
    id: 11,
    label: "Intent tag",
    description:
      "AI-classified communication intent — what kind of ask is this?",
  },
  {
    id: 12,
    label: "Mark done",
    description: "Resolve the task — moves it to the Resolved drawer",
  },
  {
    id: 13,
    label: "Move column",
    description: "Reassign priority — shifts to Urgent, Normal, or Low",
  },
  {
    id: 14,
    label: "Set tier",
    description: "Manually pin a P1/P2/P3 emphasis badge onto the card",
  },
  {
    id: 15,
    label: "Delete",
    description: "Soft delete — moves to Trash, recoverable for 30 days",
  },
  {
    id: 16,
    label: "Note chips",
    description: "Inline preview of attached notes — click to read",
  },
  {
    id: 17,
    label: "Provenance",
    description: "Full audit trail of every message that formed this task",
  },
  {
    id: 18,
    label: "Platform badge",
    description: "Which integration this message came from",
  },
  {
    id: 19,
    label: "Sender",
    description: "Who sent the original message",
  },
  {
    id: 20,
    label: "Open source",
    description: "Deep link back to the original message in Slack, Gmail, etc.",
  },
] as const;

type AnnotationId = (typeof ANNOTATIONS)[number]["id"];

// =============================================================
// MARKER — numbered circle that highlights on hover
// =============================================================

function Marker({
  id,
  active,
  onHover,
  className = "",
}: {
  id: AnnotationId;
  active: boolean;
  onHover: (id: AnnotationId | null) => void;
  className?: string;
}) {
  return (
    <span
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className={`
        inline-flex h-4 w-4 shrink-0 cursor-default items-center justify-center
        rounded-full text-[8px] font-bold leading-none
        transition-all duration-150 select-none
        ${
          active
            ? "bg-indigo-500 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.25)]"
            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
        }
        ${className}
      `}
    >
      {id}
    </span>
  );
}

// =============================================================
// HIGHLIGHT — wraps a card element, shows indigo ring when active.
// Defined at module level (not inside render) to avoid recreation.
// =============================================================

function Highlight({
  id,
  activeId,
  onHover,
  children,
  inline = false,
}: {
  id: AnnotationId;
  activeId: AnnotationId | null;
  onHover: (id: AnnotationId | null) => void;
  children: React.ReactNode;
  inline?: boolean;
}) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className={`relative rounded transition-all duration-150 ${
        activeId === id
          ? "outline-2 outline-indigo-400/70 outline-offset-1 bg-indigo-50/60 dark:bg-indigo-500/10 [outline-style:solid]"
          : ""
      }`}
    >
      {children}
    </Tag>
  );
}

// =============================================================
// STENCIL CARD — static replica of TaskCard in hover+expanded state
// =============================================================

function StencilCard({
  active,
  onHover,
  tier,
}: {
  active: AnnotationId | null;
  onHover: (id: AnnotationId | null) => void;
  tier: number;
}) {
  const isActive = (id: AnnotationId) => active === id;
  const tierStyle = tier > 0 ? TIER_STYLE[tier] : null;
  const cardClass = tierStyle ? tierStyle.card : DEFAULT_CARD;

  return (
    // Exactly the real card wrapper: rounded-xl border shadow-sm + hover shadow-md
    // (stencil always shows hover state so we use shadow-md directly)
    <div
      className={`rounded-xl border shadow-md ring-1 ring-amber-400/30 ${cardClass}`}
    >
      {/* Card body */}
      <div className="px-4 py-3.5">
        {/* Row 1 */}
        <div className="mb-2 flex items-center gap-2">
          {/* Status */}
          <Highlight activeId={active} onHover={onHover} id={1} inline>
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open
            </span>
            <Marker
              id={1}
              active={isActive(1)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Tier badge — only shown when tier > 0, uses real TIER_STYLE classes */}
          {tierStyle && (
            <Highlight activeId={active} onHover={onHover} id={2} inline>
              <span
                className={`inline-flex h-4 items-center justify-center rounded px-1.5 text-[9px] font-bold leading-none ${tierStyle.badge}`}
              >
                {tierStyle.label}
              </span>
              <Marker
                id={2}
                active={isActive(2)}
                onHover={onHover}
                className="ml-1"
              />
            </Highlight>
          )}

          {/* Bookmark */}
          <Highlight activeId={active} onHover={onHover} id={3} inline>
            <Bookmark className="h-3 w-3 fill-blue-500 text-blue-500" />
            <Marker
              id={3}
              active={isActive(3)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Notes */}
          <Highlight activeId={active} onHover={onHover} id={4} inline>
            <span className="flex items-center gap-1">
              <NotebookPen className="h-3 w-3 text-indigo-500" />
              <span className="text-[11px] font-medium text-indigo-500">2</span>
            </span>
            <Marker
              id={4}
              active={isActive(4)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Attachments */}
          <Highlight activeId={active} onHover={onHover} id={5} inline>
            <span className="flex items-center gap-0.5 text-[11px] text-zinc-400">
              <Paperclip className="h-3 w-3" />1
            </span>
            <Marker
              id={5}
              active={isActive(5)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Review flag */}
          <Highlight activeId={active} onHover={onHover} id={6} inline>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Review
            </span>
            <Marker
              id={6}
              active={isActive(6)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Unread badge */}
          <Highlight activeId={active} onHover={onHover} id={7} inline>
            <span className="ml-auto inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_6px_rgba(244,63,94,0.5)]">
              3
            </span>
            <Marker
              id={7}
              active={isActive(7)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>
        </div>

        {/* Row 2: Title */}
        <Highlight activeId={active} onHover={onHover} id={8}>
          <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
            Review Q3 Budget Deck by Friday
          </h3>
          <Marker
            id={8}
            active={isActive(8)}
            onHover={onHover}
            className="absolute -right-1 -top-1"
          />
        </Highlight>

        {/* Row 3: meta + actions */}
        <div className="flex items-center gap-2.5">
          {/* Platform icons */}
          <Highlight activeId={active} onHover={onHover} id={9} inline>
            <span className="flex -space-x-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded ring-[1.5px] ring-white dark:ring-zinc-800 bg-white dark:bg-zinc-900">
                <SlackSvg
                  className="h-2.5 w-2.5"
                  style={{ color: "#4A154B" }}
                />
              </span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded ring-[1.5px] ring-white dark:ring-zinc-800 bg-white dark:bg-zinc-900">
                <GmailSvg
                  className="h-2.5 w-2.5"
                  style={{ color: "#D93025" }}
                />
              </span>
            </span>
            <Marker
              id={9}
              active={isActive(9)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Message count */}
          <Highlight activeId={active} onHover={onHover} id={10} inline>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              3 messages
            </span>
            <Marker
              id={10}
              active={isActive(10)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Intent tag */}
          <Highlight activeId={active} onHover={onHover} id={11} inline>
            <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-500">
              document-review
            </span>
            <Marker
              id={11}
              active={isActive(11)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-0.5">
            <Highlight activeId={active} onHover={onHover} id={12} inline>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
              </button>
              <Marker id={12} active={isActive(12)} onHover={onHover} />
            </Highlight>
            <Highlight activeId={active} onHover={onHover} id={13} inline>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
              <Marker id={13} active={isActive(13)} onHover={onHover} />
            </Highlight>
            <Highlight activeId={active} onHover={onHover} id={14} inline>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400">
                <Medal className="h-3.5 w-3.5" />
              </button>
              <Marker id={14} active={isActive(14)} onHover={onHover} />
            </Highlight>
            <Highlight activeId={active} onHover={onHover} id={15} inline>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <Marker id={15} active={isActive(15)} onHover={onHover} />
            </Highlight>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <div>
        {/* Note chip */}
        <div className="border-t border-zinc-100 px-4 pb-0 pt-3 dark:border-zinc-800/50">
          <Highlight activeId={active} onHover={onHover} id={16} inline>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-left ring-1 ring-zinc-200/80 text-[10px] font-medium text-zinc-600 dark:bg-white/3 dark:ring-zinc-700/50 dark:text-zinc-400">
              <NotebookPen className="h-2.5 w-2.5 text-indigo-400" />
              Check slide 7 numbers with Finance
            </button>
            <Marker
              id={16}
              active={isActive(16)}
              onHover={onHover}
              className="ml-1"
            />
          </Highlight>
        </div>

        {/* Provenance */}
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800/50">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
            <Highlight activeId={active} onHover={onHover} id={17} inline>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Provenance
              </span>
              <Marker
                id={17}
                active={isActive(17)}
                onHover={onHover}
                className="ml-1"
              />
            </Highlight>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/60" />
          </div>

          {/* Timeline event */}
          <div className="relative ml-1 pl-5">
            <div className="absolute bottom-5 left-1.5 top-5.75 w-px bg-zinc-200 dark:bg-zinc-700" />
            {/* Event 1 */}
            <div className="relative mb-3">
              <div className="absolute -left-4.75 top-4.5 h-2.5 w-2.5 rounded-full bg-[#4A154B] ring-[3px] ring-white dark:ring-zinc-800" />
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800/50 dark:bg-[#0f0f18]">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Highlight activeId={active} onHover={onHover} id={18} inline>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#4A154B]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4A154B] ring-1 ring-[#4A154B]/20">
                      <SlackSvg className="h-2.5 w-2.5" />
                      Slack
                    </span>
                    <Marker
                      id={18}
                      active={isActive(18)}
                      onHover={onHover}
                      className="ml-1"
                    />
                  </Highlight>
                  <Highlight activeId={active} onHover={onHover} id={19} inline>
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      Sarah Chen
                    </span>
                    <Marker
                      id={19}
                      active={isActive(19)}
                      onHover={onHover}
                      className="ml-1"
                    />
                  </Highlight>
                  <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
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
                <div className="mt-2.5 flex items-center justify-between">
                  <Highlight activeId={active} onHover={onHover} id={20} inline>
                    <a className="flex items-center gap-1 text-[11px] font-medium text-indigo-500 hover:text-indigo-600">
                      Open in Slack
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <Marker
                      id={20}
                      active={isActive(20)}
                      onHover={onHover}
                      className="ml-1"
                    />
                  </Highlight>
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
                  <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
                    Feb 7, 11:42 AM
                  </span>
                </div>
                <p className="text-[13px] leading-[1.6] text-zinc-600 dark:text-zinc-400">
                  RE: Q3 Budget — I&apos;ve added revised numbers for APAC.
                  Please check slide 7 before circulating.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// LEGEND — scrollable list of annotation entries
// =============================================================

function LegendItem({
  annotation,
  active,
  onHover,
}: {
  annotation: (typeof ANNOTATIONS)[number];
  active: boolean;
  onHover: (id: AnnotationId | null) => void;
}) {
  return (
    <motion.div
      onMouseEnter={() => onHover(annotation.id)}
      onMouseLeave={() => onHover(null)}
      animate={active ? { x: 2 } : { x: 0 }}
      transition={{ duration: 0.12 }}
      className={`flex cursor-default items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150 ${
        active
          ? "bg-indigo-50 dark:bg-indigo-500/10"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold leading-none transition-all duration-150 ${
          active
            ? "bg-indigo-500 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
        }`}
      >
        {annotation.id}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[12px] font-semibold leading-none transition-colors ${
            active
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-zinc-700 dark:text-zinc-200"
          }`}
        >
          {annotation.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">
          {annotation.description}
        </p>
      </div>
    </motion.div>
  );
}

// =============================================================
// MAIN EXPORT
// =============================================================

export function TaskCardStencil() {
  const [active, setActive] = useState<AnnotationId | null>(null);
  const [tier, setTier] = useState<number>(1);

  const TIER_TABS = [
    { value: 0, label: "Default" },
    { value: 1, label: "P1 Gold" },
    { value: 2, label: "P2 Silver" },
    { value: 3, label: "P3 Bronze" },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Card Anatomy
          </p>
          <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
            Hover any number on the card or its label to learn what it does.
          </p>
        </div>
        {/* Tier switcher */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          {TIER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTier(t.value)}
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

      {/* Two-column layout: card left, legend right */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* Card — scrollable if tall */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <StencilCard active={active} onHover={setActive} tier={tier} />
        </div>

        {/* Legend — scrollable */}
        <div className="w-52 shrink-0 overflow-y-auto scrollbar-none">
          <div className="space-y-0.5">
            {ANNOTATIONS.map((ann) => (
              <LegendItem
                key={ann.id}
                annotation={ann}
                active={active === ann.id}
                onHover={setActive}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip for active annotation */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="shrink-0 rounded-lg border border-indigo-200/60 bg-indigo-50 px-3 py-2 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          >
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              {ANNOTATIONS.find((a) => a.id === active)?.label}
            </p>
            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
              {ANNOTATIONS.find((a) => a.id === active)?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
