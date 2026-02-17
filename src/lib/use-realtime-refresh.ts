// =============================================================
// src/lib/hooks/use-realtime-refresh.ts
// Subscribes to Supabase Realtime broadcast channel.
// Calls router.refresh() when a task_change event arrives.
// Falls back to polling if Supabase is unavailable.
// =============================================================

"use client";

import { getClientSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useRealtimeRefresh(fallbackIntervalSeconds = 60) {
  const router = useRouter();
  const subscribedRef = useRef(false);

  useEffect(() => {
    const supabase = getClientSupabase();

    // If Supabase is available, use Realtime
    if (supabase && !subscribedRef.current) {
      subscribedRef.current = true;

      const channel = supabase
        .channel("tasks")
        .on("broadcast", { event: "task_change" }, () => {
          router.refresh();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        subscribedRef.current = false;
      };
    }

    // Fallback: poll if Supabase is not configured
    const timer = setInterval(() => {
      router.refresh();
    }, fallbackIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [router, fallbackIntervalSeconds]);
}
