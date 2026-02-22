"use client";

import type { NoteData } from "@/components/signal/note-modal";
import { useToast } from "@/components/signal/toast";
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
export function useNotes(taskId: string, expanded: boolean) {
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
      setList((prev) => [note, ...prev]);
      toast("Note added");
    },
    [toast],
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
      setList((prev) => prev.filter((n) => n.id !== noteId));
      toast("Note deleted");
    },
    [toast],
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
