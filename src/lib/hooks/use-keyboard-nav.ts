"use client";

import type { NodalTask } from "@/lib/mock-data";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// Keyboard Navigation Hook
//
// Manages a "focused card" concept for the kanban dashboard.
// Arrow keys navigate between cards/columns.
// Letter keys trigger actions on the focused card.
// Mouse movement (real, not scroll-induced) clears keyboard focus.
// =============================================================

export interface KeyboardNavState {
  focusedCardId: string | null;
  showOverlay: boolean;
}

interface ColumnData {
  id: string;
  cards: NodalTask[];
}

export function useKeyboardNav({
  columns,
  onAction,
  onOpenResolved,
  onOpenTrash,
  searchRef,
  disabled = false,
}: {
  columns: ColumnData[];
  onAction: (taskId: string, action: string, value?: string) => void;
  onOpenResolved: () => void;
  onOpenTrash: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}) {
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const isKeyboardActive = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Build flat index for navigation
  const getPosition = useCallback(() => {
    if (!focusedCardId) return null;
    for (let col = 0; col < columns.length; col++) {
      const row = columns[col].cards.findIndex((c) => c.id === focusedCardId);
      if (row !== -1) return { col, row };
    }
    return null;
  }, [focusedCardId, columns]);

  const getCardAt = useCallback(
    (col: number, row: number): string | null => {
      const column = columns[col];
      if (!column || column.cards.length === 0) return null;
      const clampedRow = Math.min(row, column.cards.length - 1);
      return column.cards[clampedRow]?.id ?? null;
    },
    [columns],
  );

  // Clear focus on REAL mouse movement (not scroll-induced)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isKeyboardActive.current) return;

      const prev = lastMousePos.current;
      const curr = { x: e.clientX, y: e.clientY };
      lastMousePos.current = curr;

      // Skip if this is the first event (no baseline) or coords didn't change
      if (!prev) return;
      if (prev.x === curr.x && prev.y === curr.y) return;

      // Real mouse movement — clear keyboard focus
      isKeyboardActive.current = false;
      setFocusedCardId(null);
    };

    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Main keyboard handler
  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          e.preventDefault();
        }
        return;
      }

      // Overlay toggle
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowOverlay((prev) => !prev);
        return;
      }

      // Close overlay on Escape
      if (e.key === "Escape") {
        if (showOverlay) {
          setShowOverlay(false);
          e.preventDefault();
          return;
        }
        setFocusedCardId(null);
        return;
      }

      // Global shortcuts (no focused card needed)
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenResolved();
        return;
      }
      if (e.key === "x" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenTrash();
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Navigation — Arrow keys only
      const pos = getPosition();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        isKeyboardActive.current = true;
        if (!pos) {
          // No focus — start at first card of first non-empty column
          for (const col of columns) {
            if (col.cards.length > 0) {
              setFocusedCardId(col.cards[0].id);
              break;
            }
          }
        } else {
          const nextRow = pos.row + 1;
          const column = columns[pos.col];
          if (column && nextRow < column.cards.length) {
            setFocusedCardId(column.cards[nextRow].id);
          }
          // At bottom of column — stay on current card
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        isKeyboardActive.current = true;
        if (!pos) return;
        if (pos.row > 0) {
          setFocusedCardId(columns[pos.col].cards[pos.row - 1].id);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        isKeyboardActive.current = true;
        if (!pos) return;
        for (let i = pos.col + 1; i < columns.length; i++) {
          const next = getCardAt(i, pos.row);
          if (next) {
            setFocusedCardId(next);
            break;
          }
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        isKeyboardActive.current = true;
        if (!pos) return;
        for (let i = pos.col - 1; i >= 0; i--) {
          const next = getCardAt(i, pos.row);
          if (next) {
            setFocusedCardId(next);
            break;
          }
        }
        return;
      }

      // Card actions (require focused card)
      if (!focusedCardId) return;

      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }

      if (e.key === "d" && !e.metaKey) {
        e.preventDefault();
        onAction(focusedCardId, "done");
        setFocusedCardId(null);
        return;
      }

      if (e.key === "b" && !e.metaKey) {
        e.preventDefault();
        onAction(focusedCardId, "bookmark");
        return;
      }

      if (e.key === "t" && !e.metaKey) {
        e.preventDefault();
        onAction(focusedCardId, "delete");
        setFocusedCardId(null);
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        onAction(focusedCardId, "tier", "1");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        onAction(focusedCardId, "tier", "2");
        return;
      }
      if (e.key === "3") {
        e.preventDefault();
        onAction(focusedCardId, "tier", "3");
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        onAction(focusedCardId, "tier", "0");
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    disabled,
    focusedCardId,
    showOverlay,
    columns,
    getPosition,
    getCardAt,
    onAction,
    onOpenResolved,
    onOpenTrash,
    searchRef,
  ]);

  return {
    focusedCardId,
    showOverlay,
    setShowOverlay,
    setFocusedCardId,
  };
}
