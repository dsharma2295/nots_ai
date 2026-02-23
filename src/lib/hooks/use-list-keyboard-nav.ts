"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// Lightweight keyboard nav for flat lists (drawers, bookmarks).
// Arrow Up/Down to navigate, Escape to clear focus.
// Returns focusedId + action dispatcher for parent to wire up.
// =============================================================

export function useListKeyboardNav<T extends { id: string }>({
  items,
  onAction,
  disabled = false,
}: {
  items: T[];
  onAction?: (id: string, key: string) => void;
  disabled?: boolean;
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const isActive = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Clear focus on real mouse movement
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isActive.current) return;
      const prev = lastMousePos.current;
      const curr = { x: e.clientX, y: e.clientY };
      lastMousePos.current = curr;
      if (!prev) return;
      if (prev.x === curr.x && prev.y === curr.y) return;
      isActive.current = false;
      setFocusedId(null);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const getIndex = useCallback(() => {
    if (!focusedId) return -1;
    return items.findIndex((item) => item.id === focusedId);
  }, [focusedId, items]);

  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const idx = getIndex();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        isActive.current = true;
        if (idx === -1) {
          if (items.length > 0) setFocusedId(items[0].id);
        } else if (idx < items.length - 1) {
          setFocusedId(items[idx + 1].id);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        isActive.current = true;
        if (idx > 0) {
          setFocusedId(items[idx - 1].id);
        }
        return;
      }

      // Pass action keys to parent
      if (focusedId && onAction) {
        const actionKeys = ["Enter", "d", "b", "t", "n", "r"];
        if (actionKeys.includes(e.key)) {
          e.preventDefault();
          onAction(focusedId, e.key);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, focusedId, items, getIndex, onAction]);

  // Scroll focused item into view
  useEffect(() => {
    if (!focusedId) return;
    const el = document.querySelector(`[data-task-id="${focusedId}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedId]);

  return { focusedId, setFocusedId };
}
