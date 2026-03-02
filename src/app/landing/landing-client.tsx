"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── PLATFORM SVG ICONS ──────────────────────────────────────────

function SlackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"
        fill="#E01E5A"
      />
      <path
        d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"
        fill="#36C5F0"
      />
      <path
        d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z"
        fill="#2EB67D"
      />
      <path
        d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z"
        fill="#ECB22E"
      />
      <path
        d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function GmailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.548l8.073-6.055C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
    </svg>
  );
}

function JiraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M11.53 0C8.59 5.44 9.13 11.95 12.97 16.86L7.32 22.51A12 12 0 0 1 11.53 0z"
        fill="#2684FF"
      />
      <path
        d="M11.53 0c4.08 0 7.76 1.83 10.23 4.72l-6.82 6.82a6 6 0 0 0-3.41-11.54z"
        fill="#0052CC"
      />
      <path
        d="M12.47 24C15.41 18.56 14.87 12.05 11.03 7.14l5.65-5.65A12 12 0 0 1 12.47 24z"
        fill="#2684FF"
      />
      <path
        d="M12.47 24a12 12 0 0 1-10.23-4.72l6.82-6.82a6 6 0 0 0 3.41 11.54z"
        fill="#0052CC"
      />
    </svg>
  );
}

function TrelloIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#0079BF" />
      <rect x="3.5" y="3.5" width="6.5" height="13" rx="1.5" fill="white" />
      <rect x="14" y="3.5" width="6.5" height="8.5" rx="1.5" fill="white" />
    </svg>
  );
}

function AsanaIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="4.8" r="4.8" fill="#F06A6A" />
      <circle cx="4.8" cy="17.4" r="4.8" fill="#F06A6A" />
      <circle cx="19.2" cy="17.4" r="4.8" fill="#F06A6A" />
    </svg>
  );
}

// ─── PIPELINE ICONS (product concepts, not platforms) ────────────

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function SparklesIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
      <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z" />
    </svg>
  );
}

function MergeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  );
}

const PLATFORMS = [
  { name: "Slack", Icon: SlackIcon },
  { name: "Gmail", Icon: GmailIcon },
  { name: "Jira", Icon: JiraIcon },
  { name: "Trello", Icon: TrelloIcon },
  { name: "Asana", Icon: AsanaIcon },
];

// ─── TASK CARD — pixel-perfect match to dashboard ────────────────

function DemoTaskCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        y: hovered ? -6 : 0,
        boxShadow: hovered
          ? "0 24px 48px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)"
          : "0 4px 16px rgba(0,0,0,0.15)",
      }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="w-full rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-50/95 via-yellow-50/60 to-white p-4 cursor-pointer"
    >
      {/* Row 1 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Open
        </span>
        <span className="rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-1.5 py-0.5 text-[9px] font-bold text-black shadow-sm">
          P1
        </span>
        <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_6px_rgba(244,63,94,0.5)]">
          3
        </span>
      </div>
      {/* Title */}
      <h3 className="mb-2.5 text-[14px] font-medium leading-snug tracking-tight text-zinc-900">
        Review Q3 Budget Deck — needs sign-off by Friday
      </h3>
      {/* Row 3 */}
      <div className="flex items-center gap-2.5">
        <div className="flex -space-x-1.5">
          {[SlackIcon, GmailIcon, JiraIcon].map((Icon, i) => (
            <span
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm"
            >
              <Icon className="h-3 w-3" />
            </span>
          ))}
        </div>
        <span className="text-[11px] text-zinc-400">3 messages</span>
        <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
          document-review
        </span>
      </div>
    </motion.div>
  );
}

// ─── NOISE STREAM — light background so messages are visible ─────

const MESSAGES = [
  {
    Icon: SlackIcon,
    text: "Can you review the Q3 deck by Friday?",
    sender: "Sarah Chen",
    bg: "bg-[#4A154B]/8",
    border: "border-[#E01E5A]/20",
  },
  {
    Icon: GmailIcon,
    text: "RE: Budget — please check slide 7",
    sender: "Marcus Liu",
    bg: "bg-[#EA4335]/6",
    border: "border-[#EA4335]/20",
  },
  {
    Icon: JiraIcon,
    text: "PROJ-482: Staging upgrade ready for sign-off",
    sender: "DevBot",
    bg: "bg-[#0052CC]/6",
    border: "border-[#0052CC]/20",
  },
  {
    Icon: SlackIcon,
    text: "Vendor contract needs approval — today",
    sender: "Priya K.",
    bg: "bg-[#4A154B]/8",
    border: "border-[#E01E5A]/20",
  },
  {
    Icon: GmailIcon,
    text: "Action required: expense report",
    sender: "Finance",
    bg: "bg-[#EA4335]/6",
    border: "border-[#EA4335]/20",
  },
  {
    Icon: TrelloIcon,
    text: "Card overdue: Product roadmap Q4 review",
    sender: "Trello",
    bg: "bg-[#0079BF]/6",
    border: "border-[#0079BF]/20",
  },
];

function NoiseStream() {
  const [items, setItems] = useState<number[]>([0, 1, 2]);
  useEffect(() => {
    let i = 3;
    const id = setInterval(() => {
      setItems((prev) => [...prev.slice(-4), i % MESSAGES.length]);
      i++;
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative space-y-2 overflow-hidden"
      style={{ maxHeight: 260 }}
    >
      <AnimatePresence initial={false}>
        {items.map((idx, pos) => {
          const msg = MESSAGES[idx];
          const isLatest = pos === items.length - 1;
          return (
            <motion.div
              key={`${pos}-${idx}`}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{
                opacity: isLatest ? 1 : 0.5 - (items.length - 2 - pos) * 0.15,
                y: 0,
                scale: 1,
              }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 ${msg.bg} ${msg.border}`}
            >
              <span className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm">
                <msg.Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-zinc-800">
                  {msg.text}
                </p>
                <p className="text-[10px] text-zinc-500">{msg.sender}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need to give Nots.ai access to all my messages?",
    a: "Only from platforms you explicitly connect. You control which workspaces and inboxes are linked. Disconnect any platform at any time from Settings — all stored data is deleted immediately.",
  },
  {
    q: "How does the AI decide what becomes a task?",
    a: "Three stages: first, a Gatekeeper filters bot noise, reactions, and chatter. Then an AI model reads what remains and extracts intent — action items, requests, deadlines, decisions. Only those become task cards.",
  },
  {
    q: "What happens when the same task appears across multiple platforms?",
    a: "Nots uses semantic similarity to recognise that a Slack message, Gmail follow-up, and Jira comment are about the same objective. Instead of three cards, they merge into one — with a full source timeline.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "You can change a card's priority, tier, and intent at any time with one click. If the AI assigned the wrong urgency or category, you override it directly on the card. The AI-generated title reflects what it extracted from the source message — if the underlying message is unclear, that will show in the title.",
  },
  {
    q: "Will older messages be processed when I connect a platform?",
    a: "No. Nots processes messages from the point of connection onwards. It listens for new incoming messages in real time — it does not reach back into your message history. Connect a platform and everything that arrives from that moment is processed.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-zinc-800">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 text-xl font-light leading-none"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <p className="px-6 pb-5 text-[14px] leading-relaxed text-zinc-500">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── REVEAL ON SCROLL ─────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay,
        duration: 0.55,
        type: "spring",
        stiffness: 90,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── PLATFORM TICKER — no duplicates visible ─────────────────────

function PlatformTicker() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-50 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-50 to-transparent z-10" />
      <motion.div
        className="flex gap-16 items-center w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        {/* Exactly 2 copies — each copy has all 5 platforms, no visible repeat */}
        {[...Array(2)].map((_, copyIdx) =>
          PLATFORMS.map(({ name, Icon }) => (
            <div
              key={`${copyIdx}-${name}`}
              className="flex shrink-0 items-center gap-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md border border-zinc-100">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[14px] font-semibold text-zinc-700 whitespace-nowrap">
                {name}
              </span>
            </div>
          )),
        )}
      </motion.div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm"
          : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${scrolled ? "bg-amber-500/10 ring-amber-500/30" : "bg-amber-500/15 ring-amber-500/40"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
              <path d="M3 5h18L17 10H7L3 5z" fill="#F59E0B" opacity={0.6} />
              <rect
                x="8"
                y="11"
                width="8"
                height="4"
                rx="1"
                fill="#F59E0B"
                opacity={0.95}
              />
              <circle cx="12" cy="19" r="2.5" fill="#F59E0B" />
            </svg>
          </div>
          <span
            className={`text-[16px] font-bold ${scrolled ? "text-zinc-900" : "text-white"}`}
          >
            Nots<span className="text-amber-500">.ai</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            ["#how", "How it works"],
            ["#features", "Features"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={`text-[13px] font-medium transition-colors ${scrolled ? "text-zinc-500 hover:text-zinc-900" : "text-white/70 hover:text-white"}`}
            >
              {label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-lg transition-all active:scale-95 ${
            scrolled
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-white text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          Sign in →
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden">
      <Nav />

      {/* ── HERO — dark section ─────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden bg-[#0E0F13]">
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-amber-600/5 blur-[80px]" />
        </div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-4 py-2"
        >
          <motion.span
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-amber-400"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400">
            Signal extraction · AI-powered
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.25,
            duration: 0.75,
            type: "spring",
            stiffness: 80,
          }}
          className="mx-auto max-w-4xl text-balance text-[54px] font-bold leading-[1.07] tracking-[-0.03em] text-white md:text-[72px]"
        >
          Your work is scattered
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            across too many tools.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-6 max-w-xl text-balance text-[18px] leading-relaxed text-zinc-400"
        >
          Nots reads every message from Slack, Gmail, and Jira — filters the
          noise, and shows you one clean task card per objective.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-amber-500/25 hover:bg-amber-400 hover:shadow-amber-400/35 transition-all active:scale-[0.97]"
          >
            Open Command Center
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
          <a
            href="#how"
            className="rounded-2xl border border-white/12 bg-white/6 px-7 py-4 text-[15px] font-medium text-zinc-400 hover:border-white/20 hover:text-white transition-all"
          >
            See how it works
          </a>
        </motion.div>

        {/* Platform pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-[11px] text-zinc-600 mr-1">Connects with</span>
          {PLATFORMS.map(({ name, Icon }) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/6 px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium text-zinc-300">
                {name}
              </span>
            </span>
          ))}
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.85,
            duration: 0.9,
            type: "spring",
            stiffness: 55,
          }}
          className="mt-20 w-full max-w-5xl"
        >
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_80px_1fr]">
            {/* Noise — light bg so messages are readable */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-black/10">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                The noise coming in
              </p>
              <NoiseStream />
            </div>

            {/* Arrow */}
            <div className="hidden flex-col items-center justify-center gap-3 py-8 md:flex">
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M3 5h18L17 10H7L3 5z" fill="#D97706" opacity={0.5} />
                  <rect
                    x="8"
                    y="11"
                    width="8"
                    height="4"
                    rx="1"
                    fill="#D97706"
                    opacity={0.9}
                  />
                  <circle cx="12" cy="19" r="2.5" fill="#D97706" />
                </svg>
              </motion.div>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-xl text-zinc-600"
              >
                →
              </motion.span>
            </div>

            {/* Signal — light bg */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-black/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                The signal you act on
              </p>
              <DemoTaskCard />
              <p className="text-center text-[11px] text-zinc-400">
                One card · Three sources · Zero context switching
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scroll chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 7, 0] }}
          transition={{
            opacity: { delay: 2 },
            y: { duration: 2, repeat: Infinity, delay: 2 },
          }}
          className="mt-14"
        >
          <svg
            className="h-6 w-6 text-zinc-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </section>

      {/* ── THE PROBLEM — light ──────────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              The problem
            </span>
            <h2 className="mt-3 text-[42px] font-bold tracking-tight text-zinc-900">
              You became the integration layer.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[17px] text-zinc-500">
              Manually checking tools, mentally merging context, hoping nothing
              slips through. That is not your job.
            </p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Fragmented context",
                body: "The same task discussed in Slack, updated in Jira, confirmed via email. Three sources, no consolidation.",
                accent: "bg-orange-50 border-orange-200",
              },
              {
                icon: "🔔",
                title: "Notification blindness",
                body: "When everything pings, nothing matters. Critical requests drown in emoji reactions and automated noise.",
                accent: "bg-red-50 border-red-200",
              },
              {
                icon: "⏱",
                title: "Hidden overhead",
                body: "Context switching costs 23 minutes of focus per interruption. Multiplied across a workday, it adds up to hours.",
                accent: "bg-amber-50 border-amber-200",
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={`h-full rounded-2xl border p-6 ${card.accent}`}>
                  <span className="text-3xl">{card.icon}</span>
                  <h3 className="mt-4 text-[17px] font-bold text-zinc-800">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                    {card.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — dark ──────────────────────────────────── */}
      <section id="how" className="bg-[#0E0F13] py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-20 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
              How it works
            </span>
            <h2 className="mt-3 text-[42px] font-bold tracking-tight text-white">
              Three stages. One signal.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-400">
              Every message passes through a three-stage pipeline before it
              reaches your dashboard.
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                PipeIcon: ShieldIcon,
                color: "text-amber-400",
                ring: "ring-amber-500/25 bg-amber-500/8",
                n: "01",
                title: "Gatekeeper",
                body: "Every incoming message is verified and checked. Bot noise, reactions, and low-signal chatter are eliminated before the AI ever sees them — filtering the majority of incoming volume automatically.",
              },
              {
                PipeIcon: SparklesIcon,
                color: "text-zinc-300",
                ring: "ring-white/15 bg-white/6",
                n: "02",
                title: "Refiner",
                body: "The AI reads each qualifying message, extracts the intent, assigns a priority, and writes a crisp action title. No jargon, no thread context required — just the task.",
              },
              {
                PipeIcon: MergeIcon,
                color: "text-amber-400",
                ring: "ring-amber-500/25 bg-amber-500/8",
                n: "03",
                title: "Orchestrator",
                body: "Related messages from different platforms are clustered by semantic similarity. One objective becomes one card, with a full provenance trail showing every source it came from.",
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${step.ring} ${step.color}`}
                  >
                    <step.PipeIcon className="h-7 w-7" />
                  </motion.div>
                  <span className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-500">
                    {step.n}
                  </span>
                  <h3 className="mb-3 text-[18px] font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-zinc-400 max-w-xs">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — light, uniform card heights ───────────────── */}
      <section id="features" className="bg-zinc-50 py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              Features
            </span>
            <h2 className="mt-3 text-[42px] font-bold tracking-tight text-zinc-900">
              Built for people who have too many tabs open.
            </h2>
          </Reveal>

          {/* All cards: same padding, no auto-height — grid enforces rows */}
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
            style={{ gridAutoRows: "1fr" }}
          >
            <Reveal delay={0} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Smart Titles
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  AI that reads so you don&apos;t have to.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  Every message becomes a precise 3–15 word action summary. You
                  see the task, not the thread.
                </p>
                <div className="mt-5 space-y-2">
                  {[
                    "Review Q3 Budget Deck by Friday",
                    "Approve vendor contract — expires today",
                    "Resolve critical bug in payment flow",
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 border border-zinc-100"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-[12px] text-zinc-700">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">
                  Cross-platform merging
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  One task. Every source.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  A Slack message, an email follow-up, and a Jira ticket about
                  the same objective become a single card — with the full source
                  history attached.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                  {[SlackIcon, GmailIcon, JiraIcon].map((Icon, i) => (
                    <span
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-zinc-200"
                    >
                      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </span>
                  ))}
                  <span className="text-zinc-400 mx-1 text-lg">→</span>
                  <span className="flex-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                    1 task card
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Live pipeline
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  Your inbox, in real time.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  Tasks arrive the moment messages are processed. No refresh, no
                  waiting — your Command Center updates live as your workday
                  unfolds.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                  />
                  <span className="text-[12px] font-semibold text-emerald-700">
                    Processing messages…
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.05} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600">
                  Priority &amp; Tiers
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  Urgent · Normal · Low
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  The AI assigns a starting priority. You override with one
                  click. Add emphasis tiers (P1/P2/P3) to visually lift what
                  truly cannot wait.
                </p>
                <div className="mt-5 flex gap-2">
                  <span className="rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 text-[11px] font-bold text-black">
                    P1
                  </span>
                  <span className="rounded-md bg-gradient-to-r from-slate-400 to-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-800">
                    P2
                  </span>
                  <span className="rounded-md bg-gradient-to-r from-amber-700 to-amber-600 px-3 py-1.5 text-[11px] font-bold text-amber-100">
                    P3
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Provenance
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  Every source. Always.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  Each task card maintains an immutable audit trail. Deep-link
                  directly back to the original message in Slack, Gmail, or Jira
                  in one click.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <span className="text-[11px] text-amber-600">↗</span>
                  <span className="text-[11px] text-amber-700 font-mono truncate">
                    slack://channels/C0123/p1234
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2} className="flex">
              <div className="flex w-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                  AI Search
                </span>
                <h3 className="mt-2 text-[17px] font-bold text-zinc-900">
                  Ask your tasks a question.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 flex-1">
                  Type &ldquo;/&rdquo; in the search bar to switch to AI mode.
                  Ask what needs your attention today and get a direct answer
                  from your task history.
                </p>
                <div className="mt-5 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-[12px] font-mono text-zinc-500">
                  / what needs sign-off today?
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── STATS — dark ─────────────────────────────────────────── */}
      <section className="bg-[#0E0F13] py-20 px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-12 md:grid-cols-4">
          {[
            { v: "80%", l: "Noise eliminated before AI" },
            { v: "0.85", l: "Merge similarity threshold" },
            { v: "< 2s", l: "Message to task latency" },
            { v: "100%", l: "Source provenance retained" },
          ].map(({ v, l }, i) => (
            <Reveal key={i} delay={i * 0.08} className="text-center">
              <div className="text-[36px] font-bold tabular-nums tracking-tight text-white">
                {v}
              </div>
              <div className="mt-1.5 text-[12px] text-zinc-500">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ — light ──────────────────────────────────────────── */}
      <section id="faq" className="bg-white py-28 px-6">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-12 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              FAQ
            </span>
            <h2 className="mt-3 text-[42px] font-bold tracking-tight text-zinc-900">
              Questions answered.
            </h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <FaqItem {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — dark ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0E0F13] py-32 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/8 blur-[80px]" />
        </div>
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-[48px] font-bold tracking-tight text-white leading-tight">
            Stop switching tabs.
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Start doing the work.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] text-zinc-400">
            Your Command Center is one sign-in away.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-10 py-5 text-[16px] font-bold text-white shadow-2xl shadow-amber-500/20 hover:bg-amber-400 hover:shadow-amber-400/30 transition-all active:scale-[0.97]"
          >
            Open Command Center →
          </Link>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 border-t border-zinc-800 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M3 5h18L17 10H7L3 5z" fill="#D97706" opacity={0.5} />
                <rect
                  x="8"
                  y="11"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#D97706"
                  opacity={0.9}
                />
                <circle cx="12" cy="19" r="2.5" fill="#D97706" />
              </svg>
            </div>
            <span className="text-[14px] font-bold text-white">
              Nots<span className="text-amber-500">.ai</span>
            </span>
          </div>
          <p className="text-[12px] text-zinc-500 italic">
            Cut the Noise. Keep the Context.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Terms
            </a>
            <Link
              href="/login"
              className="text-[12px] text-amber-500 hover:text-amber-400 transition-colors font-semibold"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
