// =============================================================
// Mock data for development/demo.
// Types live in @/types — re-exported here for backward compat.
// =============================================================

export type { NodalTask, Platform, Priority, SourceEvent, TaskStatus } from "@/types";

import type { NodalTask } from "@/types";

export const MOCK_TASKS: NodalTask[] = [
  {
    id: "task-001",
    title: "Review Q3 Budget Deck by Friday",
    intent: "document-review",
    priority: "HIGH",
    status: "OPEN",
    confidence: 0.95,
    needsReview: false,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-07T09:15:00Z",
    updatedAt: "2026-02-07T10:30:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,
    sourceEvents: [
      {
        id: "evt-001",
        platform: "SLACK",
        rawContent: "Hey team, can someone review the Q3 budget deck by Friday?",
        deepLink: "slack://channel?team=T123&id=C456&message=1707300900",
        sender: "Sarah Chen",
        timestamp: "2026-02-07T09:15:00Z",
        attachments: [],
      },
    ],
  },
];
