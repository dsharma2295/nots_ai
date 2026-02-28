"use client";

// AutoRefresh now reads from the RealtimeProvider in layout.tsx.
// It no longer creates its own Supabase subscription — that would
// mean multiple channels for the same event from the same client.
// RealtimeProvider handles the single subscription and router.refresh().

import { useRealtimeContext } from "@/lib/realtime-provider";

export function AutoRefresh({
  intervalSeconds: _intervalSeconds = 60,
}: {
  intervalSeconds?: number;
}) {
  const { connection } = useRealtimeContext();

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 transition-colors ${
        connection === "disconnected"
          ? "bg-zinc-50 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
          : "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {connection !== "disconnected" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            connection === "disconnected"
              ? "bg-zinc-400 dark:bg-zinc-600"
              : "bg-emerald-500"
          }`}
        />
      </span>
      <span
        className={`text-[11px] font-medium ${
          connection === "disconnected"
            ? "text-zinc-400 dark:text-zinc-500"
            : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {connection === "disconnected" ? "Offline" : "Live"}
      </span>
    </div>
  );
}
