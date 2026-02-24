"use client";

import type { NoteData } from "@/features/notes/note-modal";
import { useToast } from "@/components/toast";
import { useCallback, useEffect, useState } from "react";

/**
 * useNotes — manages notes for a task card.
 * Fetches notes lazily when `expanded` becomes true.
 * Provides CRUD callbacks with optimistic updates + toasts.
 *
 * Usage:
 *   const notes = useNotes(task.id, expanded);
 *   // notes.list, notes.loaded, notes.count(serverCount)
 *   // notes.onCreate, notes.onUpdate, notes.onDelete
 *   // notes.showCreate, notes.setShowCreate
 *   // notes.viewing, notes.setViewing
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
        onCountChange?.(taskId, next.length);
        return next;
      });
      toast("Note added");
    },
    [toast, taskId, onCountChange],
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
        onCountChange?.(taskId, next.length);
        return next;
      });
      toast("Note deleted");
    },
    [toast, taskId, onCountChange],
  );
  // Returns the display count — uses fetched data if loaded, server count otherwise
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
