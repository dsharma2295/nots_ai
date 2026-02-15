"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// LIVE RELATIVE TIME
// Updates "5m ago" every 30 seconds so it stays accurate.
// =============================================================

export function useLiveRelativeTime(iso: string): string {
  const compute = useCallback(() => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    const diffWeek = Math.floor(diffDay / 7);
    return `${diffWeek}w`;
  }, [iso]);

  const [text, setText] = useState(compute);

  useEffect(() => {
    const timer = setInterval(() => setText(compute()), 30000);
    return () => clearInterval(timer);
  }, [compute]);

  return text;
}

// =============================================================
// COUNT-UP ANIMATION
// Increments from 0 to target over ~800ms on mount.
// =============================================================

export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}

// =============================================================
// CMD+K SHORTCUT
// Focuses an element when Cmd/Ctrl + K is pressed.
// =============================================================

export function useCmdK(ref: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [ref]);
}
