"use client";

// =============================================================
// src/hooks/use-realtime-data.ts
// Generic hook: fetches data on mount, re-fetches automatically
// whenever a realtime task event fires (via RealtimeProvider).
//
// Usage:
//   const { data, loading, error } = useRealtimeData(
//     () => fetch("/api/analytics").then(r => r.json()),
//     { enabled: modalOpen, debounceMs: 400 }
//   );
//
// - enabled: only fetch when true (don't waste calls when modal closed)
// - debounceMs: wait this long after the last event before refetching
//   prevents hammering the API when a burst of events arrives (e.g.
//   bulk trash, processing batch). Default 400ms.
// - Only task_created / task_updated / task_deleted trigger a refetch.
//   The hook ignores the event payload — it always fetches fresh data
//   rather than trying to patch state client-side (simpler + correct).
// =============================================================

import { useRealtimeContext } from "@/lib/realtime-provider";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseRealtimeDataOptions {
  /** Only fetch when true. Set to modal open state. */
  enabled?: boolean;
  /** Debounce refetch after events (ms). Default: 400 */
  debounceMs?: number;
}

interface UseRealtimeDataResult<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

export function useRealtimeData<T>(
  fetcher: () => Promise<T>,
  options: UseRealtimeDataOptions = {},
): UseRealtimeDataResult<T> {
  const { enabled = true, debounceMs = 400 } = options;
  const { latestEvent } = useRealtimeContext();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Stable ref for the fetcher so we don't re-subscribe on every render
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    setError(false);
    fetcherRef
      .current()
      .then((result) => {
        setData(result);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [enabled]);

  // Initial fetch when modal opens (enabled transitions false → true)
  useEffect(() => {
    if (!enabled) return;
    execute();
    // Only re-run when enabled changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Re-fetch on any task event, debounced
  useEffect(() => {
    if (!enabled || !latestEvent) return;

    // Only refetch for events that actually change task state
    const relevant = ["task_created", "task_updated", "task_deleted"] as const;

    if (!relevant.includes(latestEvent.type as (typeof relevant)[number]))
      return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      execute();
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [latestEvent, enabled, debounceMs, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { data, loading, error, refetch: execute };
}
