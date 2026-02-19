"use client";

import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";

export function AutoRefresh({
  intervalSeconds = 60,
}: {
  intervalSeconds?: number;
}) {
  // Uses Supabase Realtime if available, falls back to polling
  useRealtimeRefresh(intervalSeconds);

  return (
    <div className="flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        Live
      </span>
    </div>
  );
}
