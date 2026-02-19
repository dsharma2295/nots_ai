"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function ConfirmDeleteModal({
  title = "Delete this task?",
  message = "This action cannot be undone. All notes and history will be permanently removed.",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" />
      <div
        className="relative z-[10001] w-full max-w-xs rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "confirmIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
        </div>
        <p className="mb-1 text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
        <p className="mb-4 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[12px] font-medium text-zinc-500 transition-all hover:bg-zinc-100 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-3.5 py-2 text-[12px] font-medium text-white transition-all hover:bg-red-600 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes confirmIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}
