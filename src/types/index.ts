// =============================================================
// Shared type definitions for Nots.ai
// =============================================================

export type Platform =
  | "SLACK"
  | "GMAIL"
  | "JIRA"
  | "TRELLO"
  | "ASANA"
  | "MANUAL";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "DONE"
  | "ARCHIVED"
  | "TRASHED";

export interface SourceEvent {
  id: string;
  platform: Platform;
  rawContent: string;
  deepLink: string;
  sender: string;
  timestamp: string;
  attachments: { name: string; url: string; mimeType?: string }[];
}

export interface NodalTask {
  id: string;
  title: string;
  intent: string;
  priority: Priority;
  status: TaskStatus;
  confidence: number;
  needsReview: boolean;
  tier: number;
  bookmarked: boolean;
  seenEventCount: number;
  createdAt: string;
  updatedAt: string;
  sourceEvents: SourceEvent[];
  noteCount: number;
  trashedAt: string | null;
  hasBeenOpened: boolean;
}
