"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// =============================================================
// PLATFORM BRAND COLOURS
// =============================================================

const PLATFORMS = [
  { name: "Slack", color: "#4A154B", bg: "#4A154B15" },
  { name: "Gmail", color: "#D93025", bg: "#D9302515" },
  { name: "Jira", color: "#0052CC", bg: "#0052CC15" },
  { name: "Trello", color: "#0079BF", bg: "#0079BF15" },
  { name: "Asana", color: "#F06A6A", bg: "#F06A6A15" },
];

// =============================================================
// NOISE STREAM — animated messages arriving and merging
// =============================================================

const SAMPLE_MESSAGES = [
  {
    platform: "Slack",
    text: "Can someone review the Q3 deck by Friday?",
    sender: "Sarah Chen",
  },
  {
    platform: "Gmail",
    text: "RE: Q3 Budget — please check slide 7",
    sender: "Marcus Liu",
  },
  {
    platform: "Jira",
    text: "PROJ-482: Staging upgrade ready for review",
    sender: "DevBot",
  },
  {
    platform: "Slack",
    text: "Heads up — vendor contract needs sign-off",
    sender: "Priya K.",
  },
  {
    platform: "Gmail",
    text: "Meeting reschedule: moved to Thursday 3pm",
    sender: "Tom Walsh",
  },
  {
    platform: "Jira",
    text: "PROJ-501: Critical bug in payment flow",
    sender: "CI/CD",
  },
  {
    platform: "Slack",
    text: "Quick question about the onboarding flow",
    sender: "Alex R.",
  },
  {
    platform: "Gmail",
    text: "Action required: approve expense report",
    sender: "Finance",
  },
];

function NoiseStream() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setVisible((prev) => {
        const next = [...prev, i % SAMPLE_MESSAGES.length];
        return next.slice(-5); // keep last 5 visible
      });
      i++;
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-80 overflow-hidden">
      <div className="absolute inset-0 space-y-2">
        {visible.map((idx, i) => {
          const msg = SAMPLE_MESSAGES[idx];
          const platform = PLATFORMS.find((p) => p.name === msg.platform)!;
          return (
            <motion.div
              key={`${i}-${idx}`}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{
                opacity: i === visible.length - 1 ? 1 : 0.35,
                x: 0,
                scale: 1,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 backdrop-blur-sm"
            >
              <span
                className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  color: platform.color,
                  background: platform.bg,
                  border: `1px solid ${platform.color}25`,
                }}
              >
                {platform.name}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-zinc-300">{msg.text}</p>
                <p className="text-[10px] text-zinc-600">{msg.sender}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </div>
  );
}

// =============================================================
// TASK CARD PREVIEW — the output of the pipeline
// =============================================================

function TaskCardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
      className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 p-4 shadow-xl shadow-black/40"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] text-zinc-500">Open</span>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
          P1
        </span>
        <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">
          3
        </span>
      </div>
      <h3 className="mb-2.5 text-[14px] font-medium text-zinc-100">
        Review Q3 Budget Deck by Friday
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {["#4A154B", "#D93025"].map((c, i) => (
            <span
              key={i}
              className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-900 ring-[1.5px] ring-zinc-800"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: c }}
              />
            </span>
          ))}
        </div>
        <span className="text-[11px] text-zinc-500">3 messages</span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
          document-review
        </span>
      </div>
    </motion.div>
  );
}

// =============================================================
// SECTION WRAPPER — fade in on scroll
// =============================================================

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// =============================================================
// STAT — animated count up
// =============================================================

function Stat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-[36px] font-bold tabular-nums tracking-tight text-zinc-100"
      >
        {value}
      </motion.div>
      <div className="mt-1 text-[12px] text-zinc-500">{label}</div>
    </div>
  );
}

// =============================================================
// NAV
// =============================================================

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-800/60 bg-[#0a0a0f]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M3 5h18L17 10H7L3 5z" fill="#6366f1" opacity={0.4} />
              <rect
                x="8"
                y="11"
                width="8"
                height="4"
                rx="1"
                fill="#6366f1"
                opacity={0.8}
              />
              <circle cx="12" cy="19" r="2" fill="#6366f1" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-zinc-100">
            Nots.ai
          </span>
        </div>

        {/* Links */}
        <div className="hidden items-center gap-6 md:flex">
          {["The problem", "How it works", "Features"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-200"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
        >
          Sign in →
        </Link>
      </div>
    </motion.nav>
  );
}

// =============================================================
// MAIN PAGE
// =============================================================

export default function LandingClient() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-zinc-100"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(99,102,241,0.08), transparent), " +
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }}
    >
      <Nav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-indigo-400">
            AI-powered signal extraction
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-balance text-[52px] font-bold leading-[1.08] tracking-tight text-zinc-100 md:text-[68px]"
          style={{ fontVariationSettings: '"wght" 700' }}
        >
          Stop checking{" "}
          <span className="relative">
            <span className="relative z-10 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              five platforms.
            </span>
            <span className="absolute inset-0 -z-0 blur-2xl bg-indigo-500/20 rounded-full" />
          </span>
          <br />
          Start doing the work.
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mx-auto mt-6 max-w-xl text-balance text-[17px] leading-relaxed text-zinc-400"
        >
          Nots.ai reads your Slack, Gmail and Jira continuously and surfaces
          what actually needs your attention. One signal. All sources.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            Open Command Center
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              →
            </motion.span>
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-6 py-3.5 text-[15px] font-medium text-zinc-400 backdrop-blur-sm transition-all hover:border-zinc-600 hover:text-zinc-200"
          >
            See how it works
          </a>
        </motion.div>

        {/* Hero visual — noise stream + arrow + task card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-20 grid w-full max-w-4xl grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]"
        >
          {/* Noise side */}
          <div>
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              The noise
            </div>
            <NoiseStream />
          </div>

          {/* Arrow / funnel */}
          <div className="hidden flex-col items-center gap-3 md:flex">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              AI Refinery
            </div>
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M3 5h18L17 10H7L3 5z" fill="#6366f1" opacity={0.5} />
                <rect
                  x="8"
                  y="11"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#6366f1"
                  opacity={0.9}
                />
                <circle cx="12" cy="19" r="2" fill="#6366f1" />
              </svg>
            </motion.div>
            <div className="text-xl text-zinc-600">→</div>
          </div>

          {/* Signal side */}
          <div>
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              The signal
            </div>
            <TaskCardPreview />
            <div className="mt-3 text-center text-[11px] text-zinc-700">
              One card. Three sources. Zero context switching.
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-700">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="h-5 w-px bg-gradient-to-b from-zinc-700 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── THE PROBLEM ───────────────────────────────────── */}
      <Section id="the-problem" className="mx-auto max-w-6xl px-6 py-32">
        <div className="mb-12 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            The problem
          </span>
          <h2 className="mt-3 text-[36px] font-bold tracking-tight text-zinc-100">
            You&apos;re the integration layer.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Manually checking five tools, mentally merging context, hoping you
            don&apos;t miss something. That&apos;s not your job.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Context fragmentation",
              body: "The same task discussed in Slack, updated in Jira, and confirmed via email. Three sources, zero consolidation.",
            },
            {
              icon: "🔔",
              title: "Notification blindness",
              body: "When everything pings, nothing matters. High-signal messages drown in a sea of 'thanks!' and emoji reactions.",
            },
            {
              icon: "⏱",
              title: "Invisible overhead",
              body: "Studies put context-switching cost at 23 minutes per interruption. Multiply by 40 daily notifications. That's the math.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
            >
              <div className="mb-3 text-2xl">{card.icon}</div>
              <h3 className="mb-2 text-[15px] font-semibold text-zinc-100">
                {card.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-zinc-500">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <Section
        id="how-it-works"
        className="border-y border-zinc-800/50 bg-zinc-900/20 py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              How it works
            </span>
            <h2 className="mt-3 text-[36px] font-bold tracking-tight text-zinc-100">
              Three stages. Zero effort.
            </h2>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-[16.67%] right-[16.67%] top-9 hidden h-px bg-gradient-to-r from-zinc-800 via-indigo-500/30 to-zinc-800 md:block" />

            {[
              {
                step: "01",
                title: "Gatekeeper",
                body: "HMAC-verified webhooks from Slack, Gmail, and Jira. 80% of noise eliminated before AI ever sees it.",
                accent: "text-zinc-400",
              },
              {
                step: "02",
                title: "Refiner",
                body: "Gemini AI extracts intent, priority, and generates a precise 3–15 word Smart Title for every passing message.",
                accent: "text-indigo-400",
              },
              {
                step: "03",
                title: "Orchestrator",
                body: "Cosine similarity clustering merges related messages. One card per objective, regardless of how many sources.",
                accent: "text-violet-400",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${step.accent}`}
                  >
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 text-[16px] font-semibold text-zinc-100">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-zinc-500">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES BENTO ───────────────────────────────── */}
      <Section id="features" className="mx-auto max-w-6xl px-6 py-32">
        <div className="mb-12 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Features
          </span>
          <h2 className="mt-3 text-[36px] font-bold tracking-tight text-zinc-100">
            Built for signal, not noise.
          </h2>
        </div>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 md:grid-cols-4">
          {/* Large card — smart titles */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className="col-span-2 row-span-2 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-indigo-950/40 to-zinc-900 p-6"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
              Smart Titles
            </span>
            <h3 className="mt-2 text-[20px] font-semibold text-zinc-100">
              AI that reads so you don&apos;t have to.
            </h3>
            <p className="mt-2 text-[13px] text-zinc-500">
              Every message gets a precise 3–15 word action summary. You see the
              task, not the thread.
            </p>
            <div className="mt-5 space-y-2">
              {[
                "Review Q3 Budget Deck by Friday",
                "Approve vendor contract — deadline today",
                "Fix critical payment flow bug",
              ].map((t, i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-2.5 rounded-lg bg-zinc-800/40 px-3 py-2"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-[12px] text-zinc-300">{t}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Provenance */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
              Provenance
            </span>
            <h3 className="mt-1.5 text-[16px] font-semibold text-zinc-100">
              Every source. Always.
            </h3>
            <p className="mt-1.5 text-[12px] text-zinc-500">
              Each card maintains an immutable audit trail. Deep-link back to
              the original message in one click.
            </p>
          </motion.div>

          {/* Priority tiers */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">
              Priority
            </span>
            <h3 className="mt-1.5 text-[14px] font-semibold text-zinc-100">
              Urgent · Normal · Low
            </h3>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              AI assigns, you override. P1/P2/P3 tiers for manual emphasis.
            </p>
          </motion.div>

          {/* Real-time */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-emerald-950/30 to-zinc-900 p-5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Real-time
            </span>
            <h3 className="mt-1.5 text-[14px] font-semibold text-zinc-100">
              Live pipeline
            </h3>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Supabase realtime. Tasks arrive the moment they&apos;re processed.
            </p>
          </motion.div>

          {/* Merging */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
              Cross-platform Merging
            </span>
            <h3 className="mt-1.5 text-[16px] font-semibold text-zinc-100">
              One task. Many sources.
            </h3>
            <p className="mt-1.5 text-[12px] text-zinc-500">
              0.85 cosine similarity threshold clusters related messages across
              platforms into a single card. Slack thread + Gmail follow-up = one
              signal.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ── INTEGRATIONS ──────────────────────────────────── */}
      <Section className="border-y border-zinc-800/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Connects to your stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 opacity-50 transition-opacity hover:opacity-100"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="text-[14px] font-medium text-zinc-400">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <Section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <Stat value="80%" label="Noise filtered before AI" />
          <Stat value="0.85" label="Similarity merge threshold" />
          <Stat value="3-15" label="Words per Smart Title" />
          <Stat value="<2s" label="Message to task latency" />
        </div>
      </Section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <Section className="relative overflow-hidden py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-[40px] font-bold tracking-tight text-zinc-100">
            Your Command Center
            <br />
            is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-400">
            One sign-in. Every task. All your platforms.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-[16px] font-semibold text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            Open Command Center
            <span>→</span>
          </Link>
        </div>
      </Section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path d="M3 5h18L17 10H7L3 5z" fill="#6366f1" opacity={0.4} />
                <rect
                  x="8"
                  y="11"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#6366f1"
                  opacity={0.8}
                />
                <circle cx="12" cy="19" r="2" fill="#6366f1" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-zinc-400">
              Nots.ai
            </span>
          </div>
          <p className="text-[12px] text-zinc-700">
            Cut the Noise. Keep the Context.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-[12px] text-zinc-700 hover:text-zinc-400"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[12px] text-zinc-700 hover:text-zinc-400"
            >
              Terms
            </a>
            <Link
              href="/login"
              className="text-[12px] text-zinc-700 hover:text-zinc-400"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
