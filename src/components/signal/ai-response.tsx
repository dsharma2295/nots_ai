"use client";

import type { AIQueryResponse } from "@/lib/validators/ai-query";
import {
  AlertTriangle,
  Check,
  Clock,
  Flag,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

// =============================================================
// LOADING STATE
// =============================================================

export function AIResponseLoading() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 dark:bg-indigo-500/[0.03]">
      {/* Shimmer bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
        <div className="h-full w-1/3 animate-[aiShimmer_1.5s_ease-in-out_infinite] rounded-full bg-indigo-500/40" />
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
        </div>
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-3/4 animate-pulse rounded bg-indigo-500/10" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-indigo-500/10" />
        </div>
      </div>
    </div>
  );
}

// =============================================================
// AI RESPONSE CARD
// =============================================================

export function AIResponseCard({
  response,
  onDismiss,
  onExecuteAction,
}: {
  response: AIQueryResponse;
  onDismiss: () => void;
  onExecuteAction: (
    action: AIQueryResponse["actions"][number],
  ) => Promise<void>;
}) {
  const [executingIdx, setExecutingIdx] = useState<number | null>(null);
  const [executedIdx, setExecutedIdx] = useState<Set<number>>(new Set());

  async function handleAction(
    action: AIQueryResponse["actions"][number],
    idx: number,
  ) {
    setExecutingIdx(idx);
    try {
      await onExecuteAction(action);
      setExecutedIdx((prev) => new Set(prev).add(idx));
    } catch {
      // Error handled by parent
    } finally {
      setExecutingIdx(null);
    }
  }

  const actionIcon = (type: string) => {
    switch (type) {
      case "updateStatus":
        return <Check className="h-3 w-3" />;
      case "updatePriority":
        return <Flag className="h-3 w-3" />;
      case "createTask":
        return <Plus className="h-3 w-3" />;
      case "snoozeTask":
        return <Clock className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const actionLabel = (action: AIQueryResponse["actions"][number]) => {
    switch (action.type) {
      case "updateStatus":
        return `Mark as ${action.status.toLowerCase().replace("_", " ")}`;
      case "updatePriority":
        return `Set priority to ${action.priority}`;
      case "createTask":
        return `Create "${action.title}"`;
      case "snoozeTask":
        return `Snooze until ${action.until}`;
      default:
        return "Execute";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-white shadow-lg shadow-indigo-500/5 dark:bg-[#0d0d1a] dark:shadow-indigo-500/[0.02]">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500" />

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 dark:bg-indigo-500/15">
              <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500/70 dark:text-indigo-400/60">
              AI Response
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Response text — render markdown-ish formatting */}
        <div className="prose-sm mb-3 text-[13px] leading-[1.7] text-zinc-700 dark:text-zinc-300">
          {response.text.split("\n").map((line, i) => {
            // Bold
            const formatted = line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="text-zinc-900 dark:text-zinc-100 font-semibold">$1</strong>',
            );
            // Bullet points
            if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
              return (
                <div key={i} className="ml-3 flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/40" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: formatted.replace(/^[-•]\s*/, ""),
                    }}
                  />
                </div>
              );
            }
            if (!line.trim()) return <div key={i} className="h-2" />;
            return (
              <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
            );
          })}
        </div>

        {/* Action buttons */}
        {response.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
            {response.actions.map((action, idx) => {
              const executed = executedIdx.has(idx);
              const executing = executingIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleAction(action, idx)}
                  disabled={executed || executing}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200 active:scale-[0.97] ${
                    executed
                      ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                      : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20 dark:hover:bg-indigo-500/20"
                  } ${executing ? "opacity-70" : ""}`}
                >
                  {executing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : executed ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    actionIcon(action.type)
                  )}
                  {executed ? "Done" : actionLabel(action)}
                </button>
              );
            })}
          </div>
        )}

        {/* Warning for modification actions */}
        {response.actions.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-600">
            <AlertTriangle className="h-3 w-3" />
            Click to confirm each action
          </div>
        )}
      </div>
    </div>
  );
}
