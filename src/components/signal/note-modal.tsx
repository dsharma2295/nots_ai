"use client";

import type { SourceEvent } from "@/lib/mock-data";
import { NotebookPen, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlatformDot } from "./platform-icon";

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
// CREATE NOTE MODAL
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
        className="relative z-[9999] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700/60 dark:bg-zinc-900"
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
          className="mb-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
          maxLength={200}
        />

        {/* Provenance dropdown */}
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="mb-3 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] text-zinc-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-300 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
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
          className="mb-4 h-32 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
          setTitle(note.title ?? "");
          setContent(note.content);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing, note, onClose]);

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
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", noteId: note.id }),
      });
      const data = await res.json();
      if (data.success) {
        onDelete(note.id);
        onClose();
      }
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" />

      {/* Modal */}
      <div
        className="relative z-[9999] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700/60 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "noteModalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Top row: trash + edit + close */}
        <div className="absolute right-4 top-4 flex items-center gap-1">
          {!editing && (
            <>
              <button
                title="Delete note"
                onClick={() => setConfirmDelete(true)}
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
            </>
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

        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
            <NotebookPen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title (optional)"
                className="text-[15px] font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                maxLength={200}
              />
            ) : (
              <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                {note.title || "Untitled Note"}
              </h2>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
              {createdDate}
            </p>
          </div>
        </div>

        {/* Linked source */}
        {note.sourceEvent && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/40">
            <PlatformDot
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
            className="mb-4 h-40 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/15"
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
      </div>
      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
          <div
            className="relative z-[10001] w-full max-w-xs rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
              Delete this note?
            </p>
            <p className="mb-4 text-[12px] text-zinc-500 dark:text-zinc-400">
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  handleDelete();
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

// =============================================================
// NOTE CHIPS ROW (displayed inside expanded card, above Provenance)
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
    <div className="group/notes relative mb-3">
      <div className="mb-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-500/10" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-400 dark:text-indigo-500">
          Notes
        </span>
        <div className="h-px flex-1 bg-indigo-100 dark:bg-indigo-500/10" />
      </div>{" "}
      {/* Left arrow */}
      {showLeft && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            scroll("left");
          }}
          className="absolute -left-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100/90 opacity-0 transition-all group-hover/notes:opacity-100 active:scale-90 dark:bg-zinc-800/90"
        >
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500">‹</span>
        </button>
      )}
      {/* Right arrow */}
      {showRight && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            scroll("right");
          }}
          className="absolute -right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100/90 opacity-0 transition-all group-hover/notes:opacity-100 active:scale-90 dark:bg-zinc-800/90"
        >
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500">›</span>
        </button>
      )}
      {/* Chips */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none"
      >
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={(e) => {
              e.stopPropagation();
              onClickNote(note);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-left ring-1 ring-zinc-200/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:ring-zinc-300 dark:bg-white/[0.03] dark:ring-zinc-700/50 dark:hover:ring-zinc-600"
          >
            {note.sourceEvent && (
              <PlatformDot
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
          </button>
        ))}
      </div>
    </div>
  );
}
