"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── PLATFORM SVG ICONS ────────────────────────────────────────────────────

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
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.907 1.528-1.148C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
      <path
        d="M12 9.548 5.455 4.64 3.927 3.493C2.31 2.28 0 3.434 0 5.457v.474l12 9.003 12-9.003v-.474c0-2.023-2.309-3.178-3.927-1.964L18.545 4.64 12 9.548z"
        fill="#FBBC05"
      />
    </svg>
  );
}

function JiraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M11.975 0C9.371 5.027 9.67 11.055 13.007 15.76L7.98 20.787A12.003 12.003 0 0 1 11.975 0z"
        fill="#2684FF"
      />
      <path
        d="M11.975 0c3.603 0 6.85 1.614 9.044 4.168L14.997 10.2a6.003 6.003 0 0 0-3.022-10.2z"
        fill="#0052CC"
      />
      <path
        d="M11.975 24c2.604-5.027 2.305-11.055-1.032-15.76l5.027-5.027A12.003 12.003 0 0 1 11.975 24z"
        fill="#2684FF"
      />
      <path
        d="M11.975 24a12.003 12.003 0 0 1-9.044-4.168l6.022-6.032a6.003 6.003 0 0 0 3.022 10.2z"
        fill="#0052CC"
      />
    </svg>
  );
}

function TrelloIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="3" fill="#0079BF" />
      <rect x="3" y="3" width="7" height="14" rx="1.5" fill="white" />
      <rect x="13" y="3" width="7" height="9" rx="1.5" fill="white" />
    </svg>
  );
}

function AsanaIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5.143" r="4.286" fill="#F06A6A" />
      <circle cx="4.286" cy="16" r="4.286" fill="#F06A6A" />
      <circle cx="19.714" cy="16" r="4.286" fill="#F06A6A" />
    </svg>
  );
}

// ─── PLATFORM CONFIG ──────────────────────────────────────────────────────

const PLATFORMS = [
  { name: "Slack", Icon: SlackIcon },
  { name: "Gmail", Icon: GmailIcon },
  { name: "Jira", Icon: JiraIcon },
  { name: "Trello", Icon: TrelloIcon },
  { name: "Asana", Icon: AsanaIcon },
];

// ─── REALISTIC TASK CARD (matches dashboard exactly) ─────────────────────

function DemoTaskCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        y: hovered ? -4 : 0,
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.3)"
          : "0 4px 12px rgba(0,0,0,0.2)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full max-w-sm rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-white p-4 shadow-md"
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
        <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(244,63,94,0.5)]">
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
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
            <SlackIcon className="h-3 w-3" />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
            <GmailIcon className="h-3 w-3" />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
            <JiraIcon className="h-3 w-3" />
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">3 messages</span>
        <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
          document-review
        </span>
      </div>
    </motion.div>
  );
}

// ─── FLOATING PLATFORM ORBS ──────────────────────────────────────────────

function FloatingOrb({
  Icon,
  x,
  y,
  delay,
  size = 48,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  x: string;
  y: string;
  delay: number;
  size?: number;
}) {
  return (
    <motion.div
      className="absolute flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl border border-white/40"
      style={{ left: x, top: y, width: size, height: size }}
      initial={{ opacity: 0, scale: 0, rotate: -15 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -12, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5, type: "spring", stiffness: 200 },
        rotate: { delay, duration: 0.5 },
        y: {
          delay: delay + 0.5,
          duration: 3 + delay * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      <Icon className="w-6 h-6" />
    </motion.div>
  );
}

// ─── NOISE STREAM ANIMATION ───────────────────────────────────────────────

const MESSAGES = [
  {
    Icon: SlackIcon,
    text: "Can you review the Q3 deck by Friday?",
    name: "Sarah Chen",
    color: "#E01E5A",
  },
  {
    Icon: GmailIcon,
    text: "RE: Budget — please check slide 7",
    name: "Marcus Liu",
    color: "#EA4335",
  },
  {
    Icon: JiraIcon,
    text: "PROJ-482: Staging upgrade ready for sign-off",
    name: "DevBot",
    color: "#0052CC",
  },
  {
    Icon: SlackIcon,
    text: "Heads up — vendor contract needs approval",
    name: "Priya K.",
    color: "#E01E5A",
  },
  {
    Icon: GmailIcon,
    text: "Action required: expense report needs review",
    name: "Finance",
    color: "#EA4335",
  },
  {
    Icon: TrelloIcon,
    text: "Card overdue: Product roadmap Q4 review",
    name: "Trello Bot",
    color: "#0079BF",
  },
];

function NoiseStream() {
  const [items, setItems] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    let i = 3;
    const id = setInterval(() => {
      setItems((prev) => [...prev.slice(-4), i % MESSAGES.length]);
      i++;
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative space-y-2 overflow-hidden"
      style={{ maxHeight: 280 }}
    >
      <AnimatePresence initial={false}>
        {items.map((idx, pos) => {
          const msg = MESSAGES[idx];
          return (
            <motion.div
              key={`${pos}-${idx}`}
              layout
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{
                opacity:
                  pos === items.length - 1
                    ? 1
                    : 0.4 - (items.length - 1 - pos) * 0.1,
                x: 0,
                scale: 1,
              }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm"
            >
              <span className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
                <msg.Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-white/80">{msg.text}</p>
                <p className="text-[10px] text-white/40">{msg.name}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#080B18] to-transparent" />
    </div>
  );
}

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need to give Nots.ai access to all my messages?",
    a: "Nots.ai only reads messages from the platforms you explicitly connect. You control which workspaces and inboxes are linked. You can disconnect any platform at any time from Settings, and all stored data is deleted immediately.",
  },
  {
    q: "How does the AI decide what becomes a task?",
    a: "The pipeline has three stages. First, a Gatekeeper filters out noise like emoji reactions, automated notifications, and chat chatter. Then an AI model reads what remains and extracts intent — it looks for action items, requests, deadlines, and decisions. Only messages that contain a genuine work action become task cards.",
  },
  {
    q: "What happens when the same task appears across multiple platforms?",
    a: "This is the core feature. Nots.ai uses semantic similarity to recognise that a Slack message, a Gmail follow-up, and a Jira comment are all about the same objective. Instead of creating three separate cards, they're merged into one — with a full source timeline showing exactly where each message came from.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "Every task card is editable. You can change the title, priority, tier, and intent at any time. Cards flagged with low AI confidence are marked for your review so nothing slips through unchecked. You're always in control — the AI surfaces, you decide.",
  },
  {
    q: "Will older messages be processed when I connect a platform?",
    a: "By default, the system processes new messages from the point of connection. Historical backfill is possible depending on your configuration and the platform's API limits — Gmail supports up to 30 days, Slack depends on your workspace plan.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] transition-colors hover:border-white/15"
      whileTap={{ scale: 0.995 }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-white/90">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/60 text-lg font-light"
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <p className="px-6 pb-5 text-[14px] leading-relaxed text-white/50">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SCROLL-TRIGGERED SECTION ─────────────────────────────────────────────

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
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MARQUEE LOGOS ────────────────────────────────────────────────────────

function PlatformMarquee() {
  const items = [...PLATFORMS, ...PLATFORMS]; // duplicate for seamless loop
  return (
    <div className="relative overflow-hidden py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080B18] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080B18] to-transparent z-10" />
      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {items.map(({ name, Icon }, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 opacity-40 hover:opacity-80 transition-opacity"
          >
            <Icon className="w-6 h-6" />
            <span className="text-[15px] font-medium text-white whitespace-nowrap">
              {name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────

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
      transition={{ duration: 0.5, type: "spring" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#080B18]/90 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/20"
          : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4.5 w-4.5 h-[18px] w-[18px]"
            >
              <path d="M3 5h18L17 10H7L3 5z" fill="#818cf8" opacity={0.5} />
              <rect
                x="8"
                y="11"
                width="8"
                height="4"
                rx="1"
                fill="#818cf8"
                opacity={0.9}
              />
              <circle cx="12" cy="19" r="2.5" fill="#818cf8" />
            </svg>
          </div>
          <span className="text-[16px] font-bold text-white tracking-tight">
            Nots<span className="text-indigo-400">.ai</span>
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
              className="text-[13px] text-white/50 hover:text-white/90 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          className="group flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 transition-all active:scale-95"
        >
          Sign in
          <motion.span
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────

function FeatureCard({
  label,
  labelColor,
  title,
  body,
  children,
  span = 1,
}: {
  label: string;
  labelColor: string;
  title: string;
  body: string;
  children?: React.ReactNode;
  span?: 1 | 2;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        y: hovered ? -4 : 0,
        boxShadow: hovered
          ? "0 24px 48px rgba(0,0,0,0.5)"
          : "0 0px 0px rgba(0,0,0,0)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-6 transition-colors hover:border-white/15 hover:bg-white/[0.06] ${
        span === 2 ? "md:col-span-2" : ""
      }`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-[0.15em] ${labelColor}`}
      >
        {label}
      </span>
      <h3 className="mt-2 text-[18px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

export default function LandingClient() {
  return (
    <div
      className="min-h-screen bg-[#080B18] text-white overflow-x-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 120% 50% at 60% 0%, rgba(99,102,241,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(99,102,241,0.05) 0%, transparent 50%)",
      }}
    >
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-violet-600/8 blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 h-48 w-96 rounded-full bg-blue-600/6 blur-[80px]" />
        </div>

        {/* Floating platform icons */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <FloatingOrb Icon={SlackIcon} x="8%" y="20%" delay={0.8} />
          <FloatingOrb Icon={GmailIcon} x="82%" y="15%" delay={1.1} />
          <FloatingOrb Icon={JiraIcon} x="6%" y="62%" delay={1.3} size={40} />
          <FloatingOrb
            Icon={TrelloIcon}
            x="85%"
            y="58%"
            delay={1.0}
            size={40}
          />
          <FloatingOrb Icon={AsanaIcon} x="78%" y="80%" delay={1.5} size={36} />
        </div>

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-4 py-1.5 shadow-lg shadow-indigo-500/10"
        >
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-indigo-400"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-300">
            AI-powered signal extraction
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            type: "spring",
            stiffness: 80,
          }}
          className="mx-auto max-w-4xl text-balance text-[56px] font-bold leading-[1.06] tracking-[-0.03em] md:text-[76px]"
        >
          Your work lives in{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              too many places.
            </span>
          </span>
          <br />
          <span className="text-white/80">Nots brings it to one.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-[18px] leading-relaxed text-white/50"
        >
          Connect your communication tools. Nots reads every message, filters
          the noise, and surfaces only what needs your attention — as a single,
          clean task card.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-2xl bg-indigo-600 px-8 py-4 text-[15px] font-bold text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open Command Center
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </span>
            <motion.div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <a
            href="#how"
            className="rounded-2xl border border-white/12 bg-white/5 px-7 py-4 text-[15px] font-medium text-white/70 backdrop-blur-sm hover:border-white/20 hover:bg-white/8 hover:text-white transition-all"
          >
            See how it works
          </a>
        </motion.div>

        {/* Platform pill strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-[12px] text-white/25">Connects with</span>
          {PLATFORMS.map(({ name, Icon }) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium text-white/60">
                {name}
              </span>
            </span>
          ))}
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.9,
            duration: 0.9,
            type: "spring",
            stiffness: 60,
          }}
          className="mt-20 w-full max-w-5xl"
        >
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* Noise side */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                The noise coming in
              </p>
              <NoiseStream />
            </div>

            {/* Arrow */}
            <div className="hidden flex-col items-center justify-center gap-3 py-8 md:flex">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                  <path d="M3 5h18L17 10H7L3 5z" fill="#818cf8" opacity={0.5} />
                  <rect
                    x="8"
                    y="11"
                    width="8"
                    height="4"
                    rx="1"
                    fill="#818cf8"
                    opacity={0.9}
                  />
                  <circle cx="12" cy="19" r="2.5" fill="#818cf8" />
                </svg>
              </motion.div>
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl text-white/20"
              >
                →
              </motion.div>
            </div>

            {/* Signal side */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                The signal you act on
              </p>
              <DemoTaskCard />
              <p className="text-center text-[11px] text-white/25">
                One card · Three sources · Zero context switching
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subtle scroll chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { delay: 2 },
            y: { duration: 2, repeat: Infinity, delay: 2 },
          }}
          className="mt-16"
        >
          <svg
            className="h-6 w-6 text-white/20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </section>

      {/* ── PLATFORM MARQUEE ─────────────────────────────────────────── */}
      <div className="border-y border-white/6 bg-white/[0.02] py-6">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/25">
          Works with your existing stack
        </p>
        <PlatformMarquee />
      </div>

      {/* ── THE PROBLEM ──────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="mb-16 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
            The problem
          </span>
          <h2 className="mt-3 text-[42px] font-bold tracking-tight">
            You&apos;re doing work about work.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[17px] text-white/50">
            Hours every week spent mentally tracking what was said where,
            copying tasks manually, and dreading the inbox.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Fragmented context",
              body: "The same task lands in Slack, gets discussed in email, updated in Jira. No one tool sees the full picture.",
              color: "from-orange-500/10 to-transparent",
              border: "border-orange-500/15",
            },
            {
              icon: "🔔",
              title: "Notification blindness",
              body: "When everything pings, nothing matters. Critical requests drown alongside emoji reactions and bot noise.",
              color: "from-red-500/10 to-transparent",
              border: "border-red-500/15",
            },
            {
              icon: "⏱",
              title: "Hidden overhead",
              body: "Context switching costs 23 minutes of focus per interruption. Multiply that across a working day and it adds up to hours.",
              color: "from-amber-500/10 to-transparent",
              border: "border-amber-500/15",
            },
          ].map((card, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className={`h-full rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} via-transparent p-6`}
              >
                <span className="text-3xl">{card.icon}</span>
                <h3 className="mt-4 text-[17px] font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-white/[0.015] py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-16 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              How it works
            </span>
            <h2 className="mt-3 text-[42px] font-bold tracking-tight">
              Three stages. One signal.
            </h2>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                color: "text-zinc-400",
                ring: "ring-white/10",
                title: "Gatekeeper",
                body: "Every incoming message is verified and checked. Bot noise, reactions, and low-signal chatter are filtered before the AI ever sees them — eliminating the majority of incoming volume automatically.",
                Icon: SlackIcon,
              },
              {
                n: "02",
                color: "text-indigo-400",
                ring: "ring-indigo-500/30",
                title: "Refiner",
                body: "The AI reads each qualifying message, extracts the intent, assigns a priority, and writes a crisp action title. No jargon, no thread context required — just the task.",
                Icon: GmailIcon,
              },
              {
                n: "03",
                color: "text-violet-400",
                ring: "ring-violet-500/30",
                title: "Orchestrator",
                body: "Related messages from different platforms are clustered by semantic similarity. One objective becomes one card, with a full provenance trail showing every source it came from.",
                Icon: JiraIcon,
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.06, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white/5 ring-1 ${step.ring}`}
                  >
                    <step.Icon className="h-7 w-7" />
                  </motion.div>
                  <span
                    className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${step.color}`}
                  >
                    {step.n}
                  </span>
                  <h3 className="mb-2 text-[18px] font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white/50">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="mb-14 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
            Features
          </span>
          <h2 className="mt-3 text-[42px] font-bold tracking-tight">
            Built for people who have too many tabs open.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard
              label="Smart Titles"
              labelColor="text-indigo-400"
              title="AI that reads so you don't have to."
              body="Every message becomes a precise, 3–15 word action summary. You see what needs doing, not what was said."
              span={1}
            >
              <div className="space-y-2">
                {[
                  "Review Q3 Budget Deck by Friday",
                  "Approve vendor contract — expires today",
                  "Resolve critical bug in payment flow",
                ].map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="text-[12px] text-white/75">{t}</span>
                  </motion.div>
                ))}
              </div>
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.08}>
            <FeatureCard
              label="Cross-platform merging"
              labelColor="text-violet-400"
              title="One task. Every source."
              body="A Slack message, an email follow-up, and a Jira ticket about the same objective become a single card — with the full source history attached."
              span={1}
            >
              <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
                {[SlackIcon, GmailIcon, JiraIcon].map((Icon, i) => (
                  <span
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ))}
                <span className="text-[11px] text-white/40 mx-1">→</span>
                <span className="flex-1 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-[11px] font-medium text-indigo-300">
                  1 task card
                </span>
              </div>
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.16}>
            <FeatureCard
              label="Live pipeline"
              labelColor="text-emerald-400"
              title="Your inbox, in real time."
              body="Tasks arrive the moment messages are processed. No refresh, no waiting — your Command Center updates live as your workday unfolds."
              span={1}
            >
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 px-3 py-2 ring-1 ring-emerald-500/15">
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-emerald-400"
                />
                <span className="text-[11px] font-medium text-emerald-400">
                  Processing messages…
                </span>
              </div>
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.05}>
            <FeatureCard
              label="Priority & Tiers"
              labelColor="text-orange-400"
              title="Urgent · Normal · Low"
              body="The AI assigns a starting priority. You override with one click. Add emphasis tiers (P1/P2/P3) to visually lift what truly cannot wait."
            >
              <div className="flex gap-2">
                <span className="rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-[11px] font-bold text-black">
                  P1
                </span>
                <span className="rounded-md bg-gradient-to-r from-slate-400 to-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                  P2
                </span>
                <span className="rounded-md bg-gradient-to-r from-amber-700 to-amber-600 px-2.5 py-1 text-[11px] font-bold text-amber-100">
                  P3
                </span>
              </div>
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.12}>
            <FeatureCard
              label="Provenance"
              labelColor="text-amber-400"
              title="Every source. Always."
              body="Each task card maintains an immutable audit trail. Deep-link directly back to the original message in Slack, Gmail, or Jira in one click."
            >
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/8 px-3 py-2">
                <span className="text-[11px] text-amber-400/70">↗</span>
                <span className="text-[11px] text-amber-300/70">
                  slack://channels/C0123/messages/1234
                </span>
              </div>
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.2}>
            <FeatureCard
              label="AI search"
              labelColor="text-blue-400"
              title="Ask your tasks a question."
              body={
                'Type "/" in the search bar to switch to AI mode. Ask "what needs my attention today?" and get a direct answer from your task history.'
              }
            >
              <div className="rounded-lg bg-white/5 px-3 py-2 text-[12px] font-mono text-white/40">
                / what needs sign-off today?
              </div>
            </FeatureCard>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-white/[0.015] py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-12 px-6 md:grid-cols-4">
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
              <div className="mt-1 text-[12px] text-white/40">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-28">
        <Reveal className="mb-12 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
            FAQ
          </span>
          <h2 className="mt-3 text-[42px] font-bold tracking-tight">
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
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-[#080B18] to-violet-900/20" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-[48px] font-bold tracking-tight leading-tight">
            Stop switching tabs.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Start doing the work.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] text-white/50">
            Your Command Center is one sign-in away.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-10 py-5 text-[16px] font-bold text-white shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 hover:shadow-indigo-500/50 transition-all hover:scale-[1.02] active:scale-[0.97]"
          >
            Open Command Center →
          </Link>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/25">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M3 5h18L17 10H7L3 5z" fill="#818cf8" opacity={0.5} />
                <rect
                  x="8"
                  y="11"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#818cf8"
                  opacity={0.9}
                />
                <circle cx="12" cy="19" r="2.5" fill="#818cf8" />
              </svg>
            </div>
            <span className="text-[14px] font-bold text-white">
              Nots<span className="text-indigo-400">.ai</span>
            </span>
          </div>
          <p className="text-[12px] text-white/25 italic">
            Cut the Noise. Keep the Context.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[12px] text-white/30 hover:text-white/60 transition-colors"
            >
              Terms
            </a>
            <Link
              href="/login"
              className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
