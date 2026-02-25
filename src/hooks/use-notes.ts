"use client";

import { useToast } from "@/components/toast";
import type { NoteData } from "@/features/notes/note-modal";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useNotes — manages notes for a task card.
 * Fetches notes lazily when `expanded` becomes true.
 * Provides CRUD callbacks with optimistic updates + toasts.
 *
 * onCountChange is stored in a ref so onCreate/onDelete always
 * call the latest version without needing it in their dep arrays —
 * this prevents the stale-closure bug where the counter doesn't
 * update until the card is clicked again.
 */
export function useNotes(
  taskId: string,
  expanded: boolean,
  onCountChange?: (taskId: string, count: number) => void,
) {
  const [list, setList] = useState<NoteData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<NoteData | null>(null);
  const { toast } = useToast();

  // Keep onCountChange in a ref so callbacks always use the latest
  // version without requiring it as a useCallback dependency.
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  // Fetch notes when card first expands
  useEffect(() => {
    if (expanded && !loaded) {
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", taskId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.notes) setList(data.notes);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [expanded, loaded, taskId]);

  const onCreate = useCallback(
    (note: NoteData) => {
      setList((prev) => {
        const next = [note, ...prev];
        // Use ref to always call the latest onCountChange
        onCountChangeRef.current?.(taskId, next.length);
        return next;
      });
      toast("Note added");
    },
    [toast, taskId],
  );

  const onUpdate = useCallback(
    (updated: NoteData) => {
      setList((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setViewing(updated);
      toast("Note saved");
    },
    [toast],
  );

  const onDelete = useCallback(
    (noteId: string) => {
      setList((prev) => {
        const next = prev.filter((n) => n.id !== noteId);
        // Use ref to always call the latest onCountChange
        onCountChangeRef.current?.(taskId, next.length);
        return next;
      });
      toast("Note deleted");
    },
    [toast, taskId],
  );

  // Returns the display count:
  // - If notes have been fetched (loaded=true), use local list length
  // - Otherwise fall back to the server-provided count from props
  const count = useCallback(
    (serverNoteCount: number) => {
      if (loaded) return list.length;
      return Math.max(serverNoteCount, list.length);
    },
    [loaded, list.length],
  );

  return {
    list,
    loaded,
    showCreate,
    setShowCreate,
    viewing,
    setViewing,
    onCreate,
    onUpdate,
    onDelete,
    count,
  };
}
