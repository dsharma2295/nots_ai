"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// =============================================================
// EYE TRACKING MATH
// =============================================================

function getEyeOffset(
  cursorX: number,
  cursorY: number,
  eyeX: number,
  eyeY: number,
  maxOffset = 3.5,
) {
  const dx = cursorX - eyeX;
  const dy = cursorY - eyeY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0 };
  const scale = Math.min(1, dist / 120);
  return {
    x: (dx / dist) * scale * maxOffset,
    y: (dy / dist) * scale * maxOffset,
  };
}

// =============================================================
// SINGLE CHARACTER — one of three observers
// =============================================================

function RobotCharacter({
  cursor,
  isHiding,
  containerRef,
  offsetX = 0,
  scaleX = 1,
  delay = 0,
}: {
  cursor: { x: number; y: number };
  isHiding: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  offsetX?: number;
  scaleX?: number;
  delay?: number;
}) {
  const charRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!charRef.current || !containerRef.current) return;
    const charRect = charRef.current.getBoundingClientRect();
    // Eye centres in screen coordinates
    const eyeCX = charRect.left + charRect.width / 2;
    const eyeCY = charRect.top + charRect.height * 0.38;
    setEyeOffset(getEyeOffset(cursor.x, cursor.y, eyeCX, eyeCY));
  }, [cursor, containerRef]);

  return (
    <motion.div
      ref={charRef}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay,
        duration: 0.6,
        type: "spring",
        stiffness: 160,
        damping: 20,
      }}
      style={{ scaleX }}
      className="relative select-none"
    >
      <svg width="72" height="92" viewBox="0 0 72 92" fill="none">
        {/* Antenna */}
        <rect x="34" y="0" width="4" height="12" rx="2" fill="#3f3f5a" />
        <circle
          cx="36"
          cy="0"
          r="4"
          fill="#6366f1"
          opacity={isHiding ? 0.3 : 0.9}
        >
          {!isHiding && (
            <animate
              attributeName="opacity"
              values="0.9;0.4;0.9"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Head — rounded rect */}
        <rect
          x="6"
          y="10"
          width="60"
          height="52"
          rx="14"
          fill="#16161f"
          stroke="#2e2e42"
          strokeWidth="1.5"
        />

        {/* Screen scanline texture */}
        <rect
          x="6"
          y="10"
          width="60"
          height="52"
          rx="14"
          fill="url(#scan)"
          opacity="0.06"
        />

        {/* Left eye socket */}
        <ellipse
          cx="24"
          cy="36"
          rx="11"
          ry="12"
          fill="#0d0d18"
          stroke="#2e2e42"
          strokeWidth="1"
        />
        {/* Right eye socket */}
        <ellipse
          cx="48"
          cy="36"
          rx="11"
          ry="12"
          fill="#0d0d18"
          stroke="#2e2e42"
          strokeWidth="1"
        />

        {/* Left iris */}
        <motion.circle
          cx={24 + eyeOffset.x}
          cy={36 + eyeOffset.y}
          r="6"
          fill="#6366f1"
          opacity={isHiding ? 0 : 0.9}
          animate={{ opacity: isHiding ? 0 : 0.9 }}
          transition={{ duration: 0.15 }}
        />
        {/* Right iris */}
        <motion.circle
          cx={48 + eyeOffset.x}
          cy={36 + eyeOffset.y}
          r="6"
          fill="#6366f1"
          opacity={isHiding ? 0 : 0.9}
          animate={{ opacity: isHiding ? 0 : 0.9 }}
          transition={{ duration: 0.15 }}
        />

        {/* Left pupil shine */}
        <motion.circle
          cx={26 + eyeOffset.x}
          cy={33 + eyeOffset.y}
          r="2"
          fill="white"
          opacity={isHiding ? 0 : 0.6}
          animate={{ opacity: isHiding ? 0 : 0.6 }}
        />
        {/* Right pupil shine */}
        <motion.circle
          cx={50 + eyeOffset.x}
          cy={33 + eyeOffset.y}
          r="2"
          fill="white"
          opacity={isHiding ? 0 : 0.6}
          animate={{ opacity: isHiding ? 0 : 0.6 }}
        />

        {/* Closed eye lines — shown when hiding */}
        <AnimatePresence>
          {isHiding && (
            <>
              <motion.path
                d="M 15 36 Q 24 29 33 36"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.path
                d="M 39 36 Q 48 29 57 36"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Mouth */}
        <motion.path
          d={isHiding ? "M 24 52 Q 36 48 48 52" : "M 24 52 Q 36 56 48 52"}
          stroke="#4b4b6a"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isHiding ? "M 24 52 Q 36 48 48 52" : "M 24 52 Q 36 56 48 52",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Neck */}
        <rect x="28" y="62" width="16" height="8" fill="#16161f" />

        {/* Body */}
        <rect
          x="12"
          y="68"
          width="48"
          height="24"
          rx="8"
          fill="#16161f"
          stroke="#2e2e42"
          strokeWidth="1.5"
        />

        {/* Chest light */}
        <circle
          cx="36"
          cy="80"
          r="4"
          fill={isHiding ? "#2e2e42" : "#6366f1"}
          opacity="0.6"
        >
          {!isHiding && (
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur="1.8s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Left arm — animates up to cover face */}
        <motion.g
          animate={{
            y: isHiding ? -44 : 0,
            rotate: isHiding ? -35 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 22,
            delay: isHiding ? delay * 0.4 : 0,
          }}
          style={{ originX: "12px", originY: "72px" }}
        >
          <rect
            x="0"
            y="70"
            width="12"
            height="24"
            rx="6"
            fill="#1e1e2e"
            stroke="#2e2e42"
            strokeWidth="1.5"
          />
          {/* Hand */}
          <circle
            cx="6"
            cy="95"
            r="6"
            fill="#1e1e2e"
            stroke="#2e2e42"
            strokeWidth="1.5"
          />
        </motion.g>

        {/* Right arm */}
        <motion.g
          animate={{
            y: isHiding ? -44 : 0,
            rotate: isHiding ? 35 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 22,
            delay: isHiding ? delay * 0.4 : 0,
          }}
          style={{ originX: "60px", originY: "72px" }}
        >
          <rect
            x="60"
            y="70"
            width="12"
            height="24"
            rx="6"
            fill="#1e1e2e"
            stroke="#2e2e42"
            strokeWidth="1.5"
          />
          {/* Hand */}
          <circle
            cx="66"
            cy="95"
            r="6"
            fill="#1e1e2e"
            stroke="#2e2e42"
            strokeWidth="1.5"
          />
        </motion.g>

        {/* Scanline pattern def */}
        <defs>
          <pattern
            id="scan"
            x="0"
            y="0"
            width="72"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="72" height="2" fill="white" />
          </pattern>
        </defs>
      </svg>
    </motion.div>
  );
}

// =============================================================
// LOGIN PAGE
// =============================================================

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHiding, setIsHiding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Track cursor globally
  useEffect(() => {
    const handler = (e: MouseEvent) =>
      setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

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
        router.push("/");
      } else {
        setError("Incorrect credentials. Try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent)",
      }}
    >
      {/* Characters */}
      <div className="mb-2 flex items-end gap-8">
        <RobotCharacter
          cursor={cursor}
          isHiding={isHiding}
          containerRef={containerRef}
          scaleX={-1}
          delay={0.1}
        />
        <RobotCharacter
          cursor={cursor}
          isHiding={isHiding}
          containerRef={containerRef}
          delay={0}
        />
        <RobotCharacter
          cursor={cursor}
          isHiding={isHiding}
          containerRef={containerRef}
          scaleX={-1}
          delay={0.15}
        />
      </div>

      {/* Form card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* Top accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="px-8 py-8">
          {/* Logo + title */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M3 5h18L17 10H7L3 5z" fill="#6366f1" opacity={0.3} />
                <rect
                  x="8"
                  y="11"
                  width="8"
                  height="4"
                  rx="1"
                  fill="#6366f1"
                  opacity={0.7}
                />
                <circle cx="12" cy="19" r="2" fill="#6366f1" />
              </svg>
            </div>
            <h1 className="text-[18px] font-semibold tracking-tight text-zinc-100">
              Command Center
            </h1>
            <p className="mt-1 text-[12px] text-zinc-500">
              Sign in to access your signals
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsHiding(false)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
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
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>

            {/* Error */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-[14px] font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/60 px-8 py-4 text-center">
          <Link
            href="/landing"
            className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-5 text-[11px] text-zinc-700"
      >
        They&apos;re watching. They just won&apos;t watch your password.
      </motion.p>
    </div>
  );
}
