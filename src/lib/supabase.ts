// =============================================================
// src/lib/supabase.ts
// Supabase Realtime — broadcast-only (no DB usage).
//
// Server side: broadcastTaskUpdate() sends events to the channel.
// Client side: getClientSupabase() subscribes to receive them.
// =============================================================

import { createClient } from "@supabase/supabase-js";

// ─── Server-side client (service role — never exposed to browser) ───

let serverClient: ReturnType<typeof createClient> | null = null;

export function getServerSupabase() {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("[Supabase] Missing server env vars — broadcast disabled");
    return null;
  }

  serverClient = createClient(url, key);
  return serverClient;
}

// ─── Client-side client (anon key — safe for browser) ───

let browserClient: ReturnType<typeof createClient> | null = null;

export function getClientSupabase() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[Supabase] Missing client env vars — realtime disabled");
    return null;
  }

  browserClient = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
  return browserClient;
}

// ─── Broadcast helper (call from server: webhooks, API routes) ───

export type TaskEvent = {
  type: "task_created" | "task_updated" | "task_deleted";
  action?:
    | "done"
    | "trash"
    | "restore"
    | "bookmark"
    | "unbookmark"
    | "priority"
    | "tier"
    | "snooze"
    | "merge"
    | "manual_create";
  taskId: string;
  platform?: string;
  taskTitle?: string;
  changes?: Record<string, unknown>;
};
export async function broadcastTaskUpdate(event: TaskEvent) {
  const supabase = getServerSupabase();
  if (!supabase) return;

  try {
    const channel = supabase.channel("tasks");
    await channel.send({
      type: "broadcast",
      event: "task_change",
      payload: event,
    });
    // Unsubscribe immediately — server doesn't need to listen
    await supabase.removeChannel(channel);
  } catch (err) {
    console.error("[Supabase Broadcast] Failed:", err);
  }
}
