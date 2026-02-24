"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// =============================================================
// PORTAL DROPDOWN — renders at document.body, never clipped
// =============================================================

export function PortalDropdown({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow > 200 || spaceBelow > spaceAbove) {
      setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    } else {
      setPos({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.right - 160,
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleScroll() {
      onClose();
    }
    function handleResize() {
      onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);
  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={dropRef}
      className="fixed z-[9999] w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
      style={{
        top: pos.top,
        bottom: pos.bottom,
        left: Math.max(8, pos.left),
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
