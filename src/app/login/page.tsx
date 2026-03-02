"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// =============================================================
// EYE TRACKING
// =============================================================

function getEyeOffset(
  cx: number,
  cy: number,
  mx: number,
  my: number,
  max = 3.5,
) {
  const dx = mx - cx;
  const dy = my - cy;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0 };
  const scale = Math.min(1, dist / 140);
  return { x: (dx / dist) * scale * max, y: (dy / dist) * scale * max };
}

// =============================================================
// ROBOT — sits to the left or right of the form
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
  const ref = useRef<HTMLDivElement>(null);
  const [eye, setEye] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.38;
    setEye(getEyeOffset(cx, cy, cursor.x, cursor.y));
  }, [cursor]);

  // mirror right robot
  const flip = side === "right" ? -1 : 1;

  return (
    <motion.div
      ref={ref}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 140, damping: 18 }}
      className="flex flex-col items-center"
    >
      <svg
        width="80"
        height="100"
        viewBox="0 0 80 100"
        fill="none"
        style={{ transform: `scaleX(${flip})` }}
      >
        {/* Antenna */}
        <rect x="37" y="0" width="6" height="14" rx="3" fill="#292524" />
        <circle cx="40" cy="0" r="5" fill="#F59E0B">
          {!isHiding && (
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="2.2s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Head */}
        <rect
          x="8"
          y="12"
          width="64"
          height="54"
          rx="14"
          fill="#1C1917"
          stroke="#292524"
          strokeWidth="1.5"
        />

        {/* Left eye socket */}
        <ellipse
          cx="27"
          cy="38"
          rx="12"
          ry="13"
          fill="#0C0A09"
          stroke="#292524"
          strokeWidth="1"
        />
        {/* Right eye socket */}
        <ellipse
          cx="53"
          cy="38"
          rx="12"
          ry="13"
          fill="#0C0A09"
          stroke="#292524"
          strokeWidth="1"
        />

        {/* Left iris */}
        <motion.circle
          cx={27 + eye.x}
          cy={38 + eye.y}
          r="6.5"
          fill="#F59E0B"
          animate={{ opacity: isHiding ? 0 : 1 }}
          transition={{ duration: 0.15 }}
        />
        {/* Right iris */}
        <motion.circle
          cx={53 + eye.x}
          cy={38 + eye.y}
          r="6.5"
          fill="#F59E0B"
          animate={{ opacity: isHiding ? 0 : 1 }}
          transition={{ duration: 0.15 }}
        />
        {/* Pupils */}
        <motion.circle
          cx={29 + eye.x}
          cy={35.5 + eye.y}
          r="2.5"
          fill="white"
          animate={{ opacity: isHiding ? 0 : 0.7 }}
          transition={{ duration: 0.15 }}
        />
        <motion.circle
          cx={55 + eye.x}
          cy={35.5 + eye.y}
          r="2.5"
          fill="white"
          animate={{ opacity: isHiding ? 0 : 0.7 }}
          transition={{ duration: 0.15 }}
        />

        {/* Closed lines */}
        <AnimatePresence>
          {isHiding && (
            <>
              <motion.path
                d="M17 38 Q27 30 37 38"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.path
                d="M43 38 Q53 30 63 38"
                stroke="#F59E0B"
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
          animate={{
            d: isHiding ? "M27 56 Q40 52 53 56" : "M27 56 Q40 60 53 56",
          }}
          transition={{ duration: 0.3 }}
          stroke="#44403C"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Neck */}
        <rect x="32" y="66" width="16" height="9" fill="#1C1917" />

        {/* Body */}
        <rect
          x="12"
          y="74"
          width="56"
          height="26"
          rx="9"
          fill="#1C1917"
          stroke="#292524"
          strokeWidth="1.5"
        />

        {/* Chest light */}
        <circle
          cx="40"
          cy="86"
          r="5"
          fill={isHiding ? "#292524" : "#F59E0B"}
          opacity="0.7"
        >
          {!isHiding && (
            <animate
              attributeName="opacity"
              values="0.7;0.25;0.7"
              dur="1.9s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Left arm */}
        <motion.g
          animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? -32 : 0 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 22,
            delay: isHiding ? delay * 0.3 : 0,
          }}
          style={{ originX: "12px", originY: "76px" }}
        >
          <rect
            x="0"
            y="76"
            width="12"
            height="22"
            rx="6"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
          />
          <circle
            cx="6"
            cy="99"
            r="6.5"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
          />
        </motion.g>

        {/* Right arm */}
        <motion.g
          animate={{ y: isHiding ? -46 : 0, rotate: isHiding ? 32 : 0 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 22,
            delay: isHiding ? delay * 0.3 : 0,
          }}
          style={{ originX: "68px", originY: "76px" }}
        >
          <rect
            x="68"
            y="76"
            width="12"
            height="22"
            rx="6"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
          />
          <circle
            cx="74"
            cy="99"
            r="6.5"
            fill="#292524"
            stroke="#3C3836"
            strokeWidth="1"
          />
        </motion.g>
      </svg>

      {/* Small label */}
      <p className="mt-2 text-[10px] font-medium text-zinc-600">
        {side === "left" ? "watching…" : "…watching"}
      </p>
    </motion.div>
  );
}

// =============================================================
// LOGIN PAGE
// =============================================================

export default function LoginPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHiding, setIsHiding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
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
        router.push("/command");
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
      className="flex min-h-screen items-center justify-center bg-[#0E0F13] px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.08), transparent)",
      }}
    >
      {/* Three-column layout: robot | form | robot */}
      <div className="flex w-full max-w-2xl items-center justify-center gap-6 md:gap-10">
        {/* Left robot */}
        <div className="hidden md:flex flex-col items-center justify-center pt-12">
          <Robot cursor={cursor} isHiding={isHiding} side="left" delay={0.15} />
        </div>

        {/* Form card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 120,
            damping: 18,
          }}
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* Amber accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M3 5h18L17 10H7L3 5z" fill="#F59E0B" opacity={0.5} />
                  <rect
                    x="8"
                    y="11"
                    width="8"
                    height="4"
                    rx="1"
                    fill="#F59E0B"
                    opacity={0.9}
                  />
                  <circle cx="12" cy="19" r="2.5" fill="#F59E0B" />
                </svg>
              </div>
              <h1 className="text-[18px] font-bold tracking-tight text-zinc-100">
                Nots<span className="text-amber-500">.ai</span>
              </h1>
              <p className="mt-1 text-[12px] text-zinc-500">
                Sign in to your Command Center
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsHiding(false)}
                  placeholder="you@company.com"
                  required
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200"
                />
              </div>

              {/* Password */}
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
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200"
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
                className="mt-2 w-full rounded-xl bg-amber-500 py-3 text-[14px] font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30 active:scale-[0.98] disabled:opacity-50"
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

          <div className="border-t border-zinc-800/60 px-8 py-4 text-center">
            <Link
              href="/"
              className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              ← Back to home
            </Link>
          </div>
        </motion.div>

        {/* Right robot */}
        <div className="hidden md:flex flex-col items-center justify-center pt-12">
          <Robot cursor={cursor} isHiding={isHiding} side="right" delay={0.2} />
        </div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] text-zinc-700"
      >
        They&apos;re watching. They just won&apos;t watch your password.
      </motion.p>
    </div>
  );
}
