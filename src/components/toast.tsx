"use client";

// =============================================================
// toast.tsx — Sonner-backed, fully backward-compatible shim.
//
// Every existing call site works unchanged:
//   toast("message")              → success toast
//   toast("message", "error")     → error toast
//   toast("message", "info")      → info toast
//
// New optional third argument for Undo (used only in signal-stream):
//   toast("message", undefined, { undo: { label: "Undo", action: fn } })
//
// ToastProvider is kept as a no-op so layout.tsx import doesn't break.
// The real <Toaster /> is added to layout.tsx separately.
// =============================================================

import { createContext, useContext } from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info";

export interface ToastUndoOptions {
  label: string;
  action: () => void;
}

interface ToastContextValue {
  toast: (
    message: string,
    variant?: ToastVariant,
    opts?: { undo?: ToastUndoOptions },
  ) => void;
}

// Context kept for structural compatibility — value provided by ToastProvider shim
const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// Internal fire function
function fireToast(
  message: string,
  variant: ToastVariant = "success",
  opts?: { undo?: ToastUndoOptions },
) {
  const sonnerOpts = {
    duration: opts?.undo ? 4000 : 3000,
    ...(opts?.undo
      ? {
          action: {
            label: opts.undo.label,
            onClick: opts.undo.action,
          },
        }
      : {}),
  };

  if (variant === "error") {
    sonnerToast.error(message, sonnerOpts);
  } else if (variant === "info") {
    sonnerToast.info(message, sonnerOpts);
  } else {
    sonnerToast.success(message, sonnerOpts);
  }
}

// No-op provider — keeps layout.tsx import working.
// <Toaster /> in layout.tsx does the actual rendering.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = (
    message: string,
    variant?: ToastVariant,
    opts?: { undo?: ToastUndoOptions },
  ) => fireToast(message, variant, opts);

  return (
    <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>
  );
}
