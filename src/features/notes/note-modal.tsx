"use client";

import { PlatformIcon } from "@/components/platform-icon";
import type { SourceEvent } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { NotebookPen, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// =============================================================
// TYPES
// =============================================================

export interface NoteData {
  id: string;
  taskId: string;
  title: string | null;
  content: string;
  sourceEventId: string | null;
  sourceEvent: {
    id: string;
    platform: string;
    sender: string | null;
    rawContent: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================
// CREATE NOTE MODAL — identical to current, no changes needed
// =============================================================

export function CreateNoteModal({
  taskId,
  sourceEvents,
  onClose,
  onCreate,
}: {
  taskId: string;
  sourceEvents: SourceEvent[];
  onClose: () => void;
  onCreate: (note: NoteData) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCreate = useCallback(async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          taskId,
          title: title.trim() || undefined,
          content: content.trim(),
          sourceEventId: selectedEventId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.note) {
        onCreate(data.note as NoteData);
        onClose();
      }
    } catch (err) {
      console.error("[Note] Create failed:", err);
    } finally {
      setSaving(false);
    }
  }, [taskId, title, content, selectedEventId, saving, onCreate, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" />

      {/* Modal */}
      <div
        className="relative z-[9999] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "noteModalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
            <NotebookPen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            Add Note
          </h2>
        </div>

        {/* Title (optional) */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a title (optional)"
          className="mb-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
          maxLength={200}
        />

        {/* Provenance dropdown */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="mb-3 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
        >
          <option value="">General (no specific source)</option>
          {sourceEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.platform} — {evt.sender ?? "Unknown"} —{" "}
              {evt.rawContent.slice(0, 50)}...
            </option>
          ))}
        </select>

        {/* Content */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          className="mb-4 h-32 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
          maxLength={5000}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-[13px] font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!content.trim() || saving}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// =============================================================
// VIEW/EDIT NOTE MODAL
// Changes from original:
//   - Removed confirmDelete state + nested confirm overlay
//   - Added inline expanding delete: trash → "Delete? Yes / No" pill
//   - Auto-reverts confirming state after 3s if no action taken
//   - Escape key: confirming → idle → editing cancel → close modal
//   - motion.div with layoutId for chip→modal morph (enhancement #3)
//   - Animated backdrop fade-in
// =============================================================

export function ViewNoteModal({
  note,
  onClose,
  onUpdate,
  onDelete,
}: {
  note: NoteData;
  onClose: () => void;
  onUpdate: (updated: NoteData) => void;
  onDelete: (noteId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  // "idle" | "confirming" — replaces the old confirmDelete modal entirely
  const [deleteState, setDeleteState] = useState<"idle" | "confirming">("idle");
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the modal is closing due to a delete (chip will be gone,
  // so layoutId morph has no target — use fast fade instead of spring-back).
  const isDeletingRef = useRef(false);

  // Auto-revert confirming → idle after 3s of inaction
  useEffect(() => {
    if (deleteState === "confirming") {
      cancelTimerRef.current = setTimeout(() => setDeleteState("idle"), 3000);
    }
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    };
  }, [deleteState]);

  // Escape hierarchy: confirming → idle → editing cancel → close
  // capture:true ensures this fires BEFORE the resolved drawer's bubble-phase
  // listener. stopPropagation() then prevents the drawer from also handling it.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (deleteState === "confirming") {
          setDeleteState("idle");
        } else if (editing) {
          setEditing(false);
          setTitle(note.title ?? "");
          setContent(note.content);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () =>
      window.removeEventListener("keydown", handler, { capture: true });
  }, [editing, deleteState, note, onClose]);

  const handleSave = useCallback(async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          noteId: note.id,
          title: title.trim() || null,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.note) {
        onUpdate(data.note as NoteData);
        setEditing(false);
      }
    } catch (err) {
      console.error("[Note] Update failed:", err);
    } finally {
      setSaving(false);
    }
  }, [note.id, title, content, saving, onUpdate]);

  const handleDelete = useCallback(async () => {
    // Mark as deleting so the modal uses fast fade exit (chip no longer exists
    // in DOM after onDelete, so layoutId spring-back would have no target).
    isDeletingRef.current = true;
    onDelete(note.id);
    onClose();
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", noteId: note.id }),
      });
    } catch (err) {
      console.error("[Note] Delete failed:", err);
    }
  }, [note.id, onDelete, onClose]);

  const createdDate = new Date(note.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Animated backdrop — exit matches the modal's exit path */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          transition: { duration: isDeletingRef.current ? 0.15 : 0.35 },
        }}
        transition={{ duration: 0.15 }}
      />

      {/*
        Modal — shares layoutId with the NoteChip that opened it.
        On normal close (X / Escape): exit is undefined, so layoutId spring-back
        morphs the modal back into the chip position.
        On delete: isDeletingRef is true, chip is already removed from DOM, so
        we use a fast fade instead (no chip target to spring back to).
      */}
      <motion.div
        layoutId={`note-chip-${note.id}`}
        className="relative z-[9999] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        exit={
          isDeletingRef.current
            ? {
                opacity: 0,
                scale: 0.97,
                transition: { duration: 0.15, ease: "easeIn" },
              }
            : undefined
        }
      >
        {/* Top row — right-anchored, confirming pill overlays edit+close */}
        <div className="absolute right-4 top-4 flex items-center">
          {!editing && (
            <AnimatePresence mode="wait" initial={false}>
              {deleteState === "confirming" ? (
                /*
                  Confirming state: pill slides in from the right,
                  covering the whole button area. No layout shift on
                  the title because the row is absolutely positioned.
                */
                <motion.div
                  key="confirm-row"
                  initial={{ opacity: 0, x: 12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 dark:border-red-500/20 dark:bg-red-500/10"
                >
                  <span className="whitespace-nowrap text-[11px] font-medium text-red-500 dark:text-red-400">
                    Delete?
                  </span>
                  <button
                    onClick={handleDelete}
                    className="whitespace-nowrap rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white transition-all hover:bg-red-600 active:scale-95"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteState("idle")}
                    className="whitespace-nowrap text-[10px] font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    No
                  </button>
                </motion.div>
              ) : (
                /* Idle state: normal trash + edit + close buttons */
                <motion.div
                  key="action-buttons"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex items-center gap-1"
                >
                  <button
                    title="Delete note"
                    onClick={() => setDeleteState("confirming")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Edit note"
                    onClick={() => setEditing(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 dark:text-zinc-500 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Close"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          {editing && (
            <button
              title="Close"
              onClick={() => {
                setEditing(false);
                setTitle(note.title ?? "");
                setContent(note.content);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Header — pr-28 reserves space for the absolute button row (trash+edit+close = ~7rem) */}
        <div className="mb-4 flex items-center gap-2.5 pr-28">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
            <NotebookPen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title (optional)"
                className="w-full text-[15px] font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                maxLength={200}
              />
            ) : (
              <h2 className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                {note.title || "Untitled Note"}
              </h2>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {createdDate}
            </p>
          </div>
        </div>

        {/* Linked source */}
        {note.sourceEvent && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/40">
            <PlatformIcon
              platform={
                note.sourceEvent.platform as
                  | "SLACK"
                  | "GMAIL"
                  | "JIRA"
                  | "TRELLO"
                  | "ASANA"
                  | "MANUAL"
              }
            />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {note.sourceEvent.sender ?? "Unknown"} —{" "}
              {note.sourceEvent.rawContent.slice(0, 60)}...
            </span>
          </div>
        )}

        {/* Content */}
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-4 h-40 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
            maxLength={5000}
          />
        ) : (
          <div className="mb-4 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            {note.content}
          </div>
        )}

        {/* Edit mode actions */}
        {editing && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setTitle(note.title ?? "");
                setContent(note.content);
              }}
              className="rounded-xl px-4 py-2 text-[13px] font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}

// =============================================================
// NOTE CHIPS ROW
// Change: button → motion.button with layoutId so it morphs into
// ViewNoteModal when clicked (requires AnimatePresence in parent).
// hover:-translate-y-0.5 removed — motion handles transforms now.
// =============================================================

export function NoteChips({
  notes,
  onClickNote,
}: {
  notes: NoteData[];
  onClickNote: (note: NoteData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, notes.length]);

  const scroll = useCallback((dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -140 : 140,
      behavior: "smooth",
    });
  }, []);

  if (notes.length === 0) return null;

  return (
    <div className="group/notes mb-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-500/10" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-500">
          Notes
        </span>
        <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-500/10" />
      </div>
      {/* Chips row with arrows */}
      <div className="relative">
        {/* Left arrow */}
        {showLeft && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll("left");
            }}
            className="absolute -left-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm opacity-0 transition-all group-hover/notes:opacity-100 active:scale-90 dark:border-zinc-600 dark:bg-zinc-700"
          >
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-300">
              ‹
            </span>
          </button>
        )}
        {/* Right arrow */}
        {showRight && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll("right");
            }}
            className="absolute -right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm opacity-0 transition-all group-hover/notes:opacity-100 active:scale-90 dark:border-zinc-600 dark:bg-zinc-700"
          >
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-300">
              ›
            </span>
          </button>
        )}
        {/* Chips — motion.button with layoutId for morph transition */}
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto px-1 pt-1 pb-1 scrollbar-none"
        >
          {notes.map((note) => (
            <motion.button
              key={note.id}
              layoutId={`note-chip-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onClickNote(note);
              }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-left ring-1 ring-zinc-200/80 backdrop-blur-sm transition-colors duration-200 hover:shadow-sm hover:ring-zinc-300 dark:bg-white/[0.03] dark:ring-zinc-700/50 dark:hover:ring-zinc-600"
            >
              {note.sourceEvent && (
                <PlatformIcon
                  platform={
                    note.sourceEvent.platform as
                      | "SLACK"
                      | "GMAIL"
                      | "JIRA"
                      | "TRELLO"
                      | "ASANA"
                      | "MANUAL"
                  }
                />
              )}
              <span className="max-w-[100px] truncate text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                {note.title || note.content.slice(0, 25)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
