"use client";

import type {
  ActivityEvent,
  ConnectionState,
  PulseState,
} from "@/lib/use-realtime-refresh";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { createContext, useContext, type ReactNode } from "react";

interface RealtimeContextValue {
  connection: ConnectionState;
  pulse: PulseState;
  latestEvent: ActivityEvent | null;
  history: ActivityEvent[];
  recentArrivalIds: Set<string>;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connection: "connected",
  pulse: "idle",
  latestEvent: null,
  history: [],
  recentArrivalIds: new Set(),
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({
  children,
  intervalSeconds = 60,
}: {
  children: ReactNode;
  intervalSeconds?: number;
}) {
  const state = useRealtimeRefresh(intervalSeconds);

  return (
    <RealtimeContext.Provider value={state}>
      {children}
    </RealtimeContext.Provider>
  );
}
