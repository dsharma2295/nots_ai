"use client";

import type { TaskEvent } from "@/lib/supabase";
import { getClientSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
        .on(
          "broadcast",
          { event: "task_change" },
          (msg: {
            payload: TaskEvent & { platform?: string; taskTitle?: string };
          }) => {
            const payload = msg.payload;

            console.log("[Realtime] Broadcast received:", payload);

            const event: ActivityEvent = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: payload.type,
              taskId: payload.taskId,
              platform: payload.platform,
              taskTitle: payload.taskTitle,
              timestamp: Date.now(),
            };

            setLatestEvent(event);
            setHistory((prev) => [event, ...prev].slice(0, 10));

            if (
              payload.type === "task_created" ||
              payload.type === "task_updated"
            ) {
              setRecentArrivalIds((prev) => new Set(prev).add(payload.taskId));
              markArrivalSeen(payload.taskId);
            }

            setPulse("processing");

            if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
            if (activityTimeoutRef.current)
              clearTimeout(activityTimeoutRef.current);

            pulseTimeoutRef.current = setTimeout(() => {
              setPulse("updated");

              pulseTimeoutRef.current = setTimeout(() => {
                setPulse("activity");

                activityTimeoutRef.current = setTimeout(() => {
                  setPulse("idle");
                  setLatestEvent(null);
                }, 3000);
              }, 800);
            }, 600);

            router.refresh();
          },
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            setConnection("connected");
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
