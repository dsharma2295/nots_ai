"use client";

import { AlertTriangle, Check, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// =============================================================
// TYPES
// =============================================================

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// =============================================================
// CONTEXT
// =============================================================

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// =============================================================
// VARIANT CONFIG
// =============================================================

const VARIANT_STYLE: Record<
  ToastVariant,
  { bg: string; icon: typeof Check; iconColor: string }
> = {
  success: {
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    icon: Check,
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  error: {
    bg: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",
    icon: AlertTriangle,
    iconColor: "text-red-500 dark:text-red-400",
  },
  info: {
    bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    icon: Info,
    iconColor: "text-indigo-500 dark:text-indigo-400",
  },
};

// =============================================================
// PROVIDER
// =============================================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, variant }]);

      // Start exit animation after 2.5s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );
      }, 2500);

      // Remove after exit animation completes (300ms)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2800);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container — bottom right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
          {toasts.map((t) => {
            const v = VARIANT_STYLE[t.variant];
            const Icon = v.icon;

            return (
              <div
                key={t.id}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${v.bg} ${
                  t.exiting
                    ? "translate-x-[120%] opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
                style={{
                  animation: t.exiting
                    ? undefined
                    : "toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <Icon className={`h-4 w-4 shrink-0 ${v.iconColor}`} />
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                  {t.message}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
