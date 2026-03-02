"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// =============================================================
// EYE TRACKING
// =============================================================

function getEyeOffset(cx: number, cy: number, mx: number, my: number, max = 4) {
  const dx = mx - cx;
  const dy = my - cy;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0 };
  return {
    x: (dx / dist) * Math.min(1, dist / 150) * max,
    y: (dy / dist) * Math.min(1, dist / 150) * max,
  };
}

// =============================================================
// ROBOT — peeks over the card edge
// =============================================================

function Robot({
  cursor,
  isHiding,
  side,
  delay = 0,
}: {
  cursor: { x: number; y: number };
  isHiding: boolean;
  side: "left" | "right";
  delay?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [eye, setEye] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setEye(
      getEyeOffset(
        r.left + r.width / 2,
        r.top + r.height * 0.35,
        cursor.x,
        cursor.y,
      ),
    );
  }, [cursor]);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 130, damping: 16 }}
      className="flex flex-col items-center"
    >
      {/* Body hover bob */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 2,
        }}
      >
        <svg ref={ref} width="96" height="110" viewBox="0 0 96 110" fill="none">
          {/* Antenna — mirrored for right robot */}
          <rect x="44" y="0" width="8" height="16" rx="4" fill="#292524" />
          <circle cx="48" cy="1" r="6" fill="#F59E0B">
            {!isHiding && (
              <animate
                attributeName="r"
                values="6;8;6"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Glow */}
          {!isHiding && (
            <circle cx="48" cy="1" r="10" fill="#F59E0B" opacity="0.2">
              <animate
                attributeName="r"
                values="10;14;10"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Head — structural, safe to mirror */}
          <rect
            x="6"
            y="14"
            width="84"
            height="62"
            rx="18"
            fill="#1C1917"
            stroke="#3C3836"
            strokeWidth="1.5"
          />
          <rect
            x="6"
            y="14"
            width="84"
            height="30"
            rx="18"
            fill="white"
            opacity="0.03"
          />

          {/* Eye sockets */}
          <ellipse
            cx="30"
            cy="43"
            rx="14"
            ry="15"
            fill="#0C0A09"
            stroke="#292524"
            strokeWidth="1"
          />
          <ellipse
            cx="66"
            cy="43"
            rx="14"
            ry="15"
            fill="#0C0A09"
            stroke="#292524"
            strokeWidth="1"
          />

          {/* Eyes — always track cursor correctly, no flip */}
          <motion.circle
            cx={30 + eye.x}
            cy={43 + eye.y}
            r="8"
            fill="#F59E0B"
            animate={{ opacity: isHiding ? 0 : 1 }}
            transition={{ duration: 0.18 }}
          />
          <motion.circle
            cx={66 + eye.x}
            cy={43 + eye.y}
            r="8"
            fill="#F59E0B"
            animate={{ opacity: isHiding ? 0 : 1 }}
            transition={{ duration: 0.18 }}
          />
          <motion.circle
            cx={33 + eye.x}
            cy={39.5 + eye.y}
            r="3"
            fill="white"
            animate={{ opacity: isHiding ? 0 : 0.65 }}
            transition={{ duration: 0.18 }}
          />
          <motion.circle
            cx={69 + eye.x}
            cy={39.5 + eye.y}
            r="3"
            fill="white"
            animate={{ opacity: isHiding ? 0 : 0.65 }}
            transition={{ duration: 0.18 }}
          />

          {/* Closed eye lines */}
          <AnimatePresence>
            {isHiding && (
              <>
                <motion.path
                  d="M18 43 Q30 34 42 43"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                />
                <motion.path
                  d="M54 43 Q66 34 78 43"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Mouth */}
          <motion.path
            animate={{
              d: isHiding ? "M30 63 Q48 58 66 63" : "M30 63 Q48 68 66 63",
            }}
            transition={{ duration: 0.35, type: "spring" }}
            stroke="#57534E"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Blush */}
          <AnimatePresence>
            {!isHiding && (
              <>
                <motion.circle
                  cx="17"
                  cy="53"
                  r="5"
                  fill="#F59E0B"
                  opacity="0.2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                />
                <motion.circle
                  cx="79"
                  cy="53"
                  r="5"
                  fill="#F59E0B"
                  opacity="0.2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Neck */}
          <rect x="38" y="76" width="20" height="10" fill="#1C1917" />
          {/* Body */}
          <rect
            x="10"
            y="84"
            width="76"
            height="26"
            rx="10"
            fill="#1C1917"
            stroke="#3C3836"
            strokeWidth="1.5"
          />
          <line
            x1="10"
            y1="97"
            x2="86"
            y2="97"
            stroke="#292524"
            strokeWidth="1"
          />
          {/* Chest */}
          <circle
            cx="48"
            cy="97"
            r="6"
            fill={isHiding ? "#292524" : "#F59E0B"}
            opacity={isHiding ? 1 : 0.8}
          >
            {!isHiding && (
              <animate
                attributeName="opacity"
                values="0.8;0.3;0.8"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Arms */}
          <motion.rect
            x="0"
            y="84"
            width="12"
            height="22"
            rx="6"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
            animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? -28 : 0 }}
            style={{ originX: "6px", originY: "84px" }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              delay: isHiding ? 0.05 : 0,
            }}
          />
          <motion.circle
            cx="6"
            cy="107"
            r="8"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
            animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? -28 : 0 }}
            style={{ originX: "6px", originY: "84px" }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              delay: isHiding ? 0.05 : 0,
            }}
          />
          <motion.rect
            x="84"
            y="84"
            width="12"
            height="22"
            rx="6"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
            animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? 28 : 0 }}
            style={{ originX: "90px", originY: "84px" }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              delay: isHiding ? 0.05 : 0,
            }}
          />
          <motion.circle
            cx="90"
            cy="107"
            r="8"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
            animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? 28 : 0 }}
            style={{ originX: "90px", originY: "84px" }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              delay: isHiding ? 0.05 : 0,
            }}
          />
        </svg>
      </motion.div>

      {/* Status label — changes with state */}
      <motion.p
        key={isHiding ? "hiding" : "watching"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`mt-2 text-[10px] font-semibold tracking-wide ${isHiding ? "text-amber-600" : "text-zinc-600"}`}
      >
        {isHiding
          ? side === "left"
            ? "not looking!"
            : "eyes closed!"
          : side === "left"
            ? "watching…"
            : "…watching"}
      </motion.p>
    </motion.div>
  );
}

// =============================================================
// SOCIAL LOGIN BUTTON
// =============================================================

function SocialBtn({
  icon,
  label,
  onDisabledClick,
}: {
  icon: React.ReactNode;
  label: string;
  onDisabledClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDisabledClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-3 py-2.5 text-[12px] font-medium text-zinc-600 opacity-50 transition-all hover:opacity-70 hover:border-zinc-600 cursor-not-allowed"
      title="Coming soon"
    >
      {icon}
      {label}
    </button>
  );
}

function SlackMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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

function GmailMark() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.548l8.073-6.055C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
    </svg>
  );
}

function SSOIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// =============================================================
// LOGIN PAGE
// =============================================================

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHiding, setIsHiding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialToast, setSocialToast] = useState(false);

  useEffect(() => {
    const fn = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  function handleSocialClick() {
    setSocialToast(true);
    setTimeout(() => setSocialToast(false), 2800);
    setTimeout(() => emailRef.current?.focus(), 400);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/command");
      } else {
        setError("Incorrect credentials. Try again.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-[#0E0F13] px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 60% at 50% 20%, rgba(245,158,11,0.07), transparent)",
      }}
    >
      {/* Toast */}
      <AnimatePresence>
        {socialToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-zinc-900 px-5 py-3 shadow-xl shadow-black/40"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[13px] font-medium text-zinc-200">
              Social login coming soon — use email for now
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout — robots flanking the card, vertically centered with it */}
      <div className="flex w-full max-w-3xl items-center gap-8">
        {/* Left robot — sits at mid-height of card */}
        <div className="hidden lg:flex flex-1 flex-col items-end justify-center">
          <Robot cursor={cursor} isHiding={isHiding} side="left" delay={0.2} />
        </div>

        {/* Form card */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.08,
            type: "spring",
            stiffness: 110,
            damping: 18,
          }}
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
        >
          {/* Amber top line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

          <div className="px-8 pt-8 pb-6">
            {/* Logo */}
            <div className="mb-7 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M3 5h18L17 10H7L3 5z" fill="#F59E0B" opacity={0.5} />
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
              <h1 className="text-[20px] font-bold tracking-tight text-zinc-100">
                Nots<span className="text-amber-500">.ai</span>
              </h1>
              <p className="mt-1 text-[12px] text-zinc-500">
                Sign in to your Command Center
              </p>
            </div>

            {/* Social options — greyed out */}
            <div className="mb-5 flex gap-2">
              <SocialBtn
                icon={<SlackMark />}
                label="Slack"
                onDisabledClick={handleSocialClick}
              />
              <SocialBtn
                icon={<GmailMark />}
                label="Gmail"
                onDisabledClick={handleSocialClick}
              />
              <SocialBtn
                icon={<SSOIcon />}
                label="SSO"
                onDisabledClick={handleSocialClick}
              />
            </div>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] font-medium text-zinc-600">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Email
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsHiding(false)}
                  placeholder="you@company.com"
                  required
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsHiding(true)}
                  onBlur={() => setIsHiding(false)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-amber-500 py-3 text-[14px] font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    Signing in…
                  </span>
                ) : (
                  "Sign in →"
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-zinc-800 px-8 py-4 text-center">
            <Link
              href="/"
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </motion.div>

        {/* Right robot */}
        <div className="hidden lg:flex flex-1 flex-col items-start justify-center">
          <Robot
            cursor={cursor}
            isHiding={isHiding}
            side="right"
            delay={0.25}
          />
        </div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-7 text-[11px] text-zinc-700"
      >
        {isHiding
          ? "Eyes closed. Your secret is safe."
          : "They\u2019re watching. They just won\u2019t watch your password."}
      </motion.p>
    </div>
  );
}
