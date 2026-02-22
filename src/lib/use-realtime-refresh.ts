"use client";

import type { TaskEvent } from "@/lib/supabase";
import { getClientSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================
// Activity Event — what the pill displays
// =============================================================

export interface ActivityEvent {
  id: string;
  type: TaskEvent["type"];
  taskId: string;
  platform?: string;
  taskTitle?: string;
  timestamp: number;
}

export type ConnectionState = "connected" | "disconnected" | "connecting";
export type PulseState = "idle" | "processing" | "updated" | "activity";

export interface RealtimeState {
  connection: ConnectionState;
  pulse: PulseState;
  latestEvent: ActivityEvent | null;
  history: ActivityEvent[];
}

// =============================================================
// Hook
// =============================================================

export function useRealtimeRefresh(fallbackIntervalSeconds = 60) {
  const router = useRouter();
  const subscribedRef = useRef(false);

  const [connection, setConnection] = useState<ConnectionState>("connected");
  const [pulse, setPulse] = useState<PulseState>("idle");
  const [latestEvent, setLatestEvent] = useState<ActivityEvent | null>(null);
  const [history, setHistory] = useState<ActivityEvent[]>([]);
  const [recentArrivalIds, setRecentArrivalIds] = useState<Set<string>>(
    new Set(),
  );

  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear arrival highlight after delay
  const markArrivalSeen = useCallback((taskId: string) => {
    setTimeout(() => {
      setRecentArrivalIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    const supabase = getClientSupabase();

    if (supabase && !subscribedRef.current) {
      subscribedRef.current = true;

      const channel = supabase
        .channel("tasks")
        .on("broadcast", { event: "task_change" }, (msg) => {
          const payload = msg.payload as TaskEvent & {
            platform?: string;
            taskTitle?: string;
          };

          // Build activity event
          const event: ActivityEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: payload.type,
            taskId: payload.taskId,
            platform: payload.platform,
            taskTitle: payload.taskTitle,
            timestamp: Date.now(),
          };

          // Update state
          setLatestEvent(event);
          setHistory((prev) => [event, ...prev].slice(0, 10));

          // Track new arrivals for card highlight
          if (
            payload.type === "task_created" ||
            payload.type === "task_updated"
          ) {
            setRecentArrivalIds((prev) => new Set(prev).add(payload.taskId));
            markArrivalSeen(payload.taskId);
          }

          // Pulse: processing → updated → activity → idle
          setPulse("processing");

          if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
          if (activityTimeoutRef.current)
            clearTimeout(activityTimeoutRef.current);

          pulseTimeoutRef.current = setTimeout(() => {
            setPulse("updated");

            pulseTimeoutRef.current = setTimeout(() => {
              setPulse("activity");
              setLatestEvent(event);

              activityTimeoutRef.current = setTimeout(() => {
                setPulse("idle");
                setLatestEvent(null);
              }, 3000);
            }, 800);
          }, 600);

          // Refresh server data
          router.refresh();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnection("connected");
            setPulse("idle");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnection("disconnected");
          }
        });

      return () => {
        supabase.removeChannel(channel);
        subscribedRef.current = false;
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        if (activityTimeoutRef.current)
          clearTimeout(activityTimeoutRef.current);
      };
    }

    // Fallback: polling — initialize state outside effect
    const timer = setInterval(() => {
      router.refresh();
    }, fallbackIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [router, fallbackIntervalSeconds, markArrivalSeen]);

  return {
    connection,
    pulse,
    latestEvent,
    history,
    recentArrivalIds,
  };
}
