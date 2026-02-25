import type { NodalTask, Platform, TaskStatus } from "@/lib/mock-data";

export const ALL_PLATFORMS: Platform[] = [
  "SLACK",
  "GMAIL",
  "JIRA",
  "TRELLO",
  "ASANA",
];
export const ALL_STATUSES: TaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];

// =============================================================
// INTENT GROUPS
// Maps Gemini's free-form intent strings to 5 semantic buckets.
// Matching is fuzzy (includes) to handle slight variations.
// =============================================================

export type IntentGroup =
  | "all"
  | "action" // task-assignment, bug-fix, fix, deploy, implement
  | "review" // document-review, code-review, review
  | "respond" // question, approval-request, feedback-request
  | "attend" // meeting-request, calendar, schedule
  | "read"; // information-sharing, announcement, fyi, update

export const INTENT_GROUPS: {
  id: IntentGroup;
  label: string;
  keywords: string[];
}[] = [
  { id: "all", label: "All", keywords: [] },
  {
    id: "action",
    label: "Action",
    keywords: [
      "task",
      "bug",
      "fix",
      "deploy",
      "implement",
      "build",
      "create",
      "update",
      "assign",
    ],
  },
  {
    id: "review",
    label: "Review",
    keywords: ["review", "check", "audit", "verify", "inspect", "approve"],
  },
  {
    id: "respond",
    label: "Respond",
    keywords: [
      "question",
      "approval",
      "feedback",
      "response",
      "reply",
      "clarif",
    ],
  },
  {
    id: "attend",
    label: "Attend",
    keywords: ["meeting", "calendar", "schedule", "sync", "standup", "call"],
  },
  {
    id: "read",
    label: "Read",
    keywords: [
      "information",
      "sharing",
      "announcement",
      "fyi",
      "update",
      "notice",
      "inform",
    ],
  },
];

export function matchIntentGroup(intent: string, group: IntentGroup): boolean {
  if (group === "all") return true;
  const g = INTENT_GROUPS.find((g) => g.id === group);
  if (!g) return true;
  const lower = intent.toLowerCase().replace(/[-_]/g, " ");
  return g.keywords.some((kw) => lower.includes(kw));
}

// =============================================================
// FILTERS
// spotlightPlatforms: if non-empty, only show tasks from those
// platforms (exclusive spotlight mode). Empty = show all.
// intentGroup: filter by semantic intent bucket.
// =============================================================

export interface Filters {
  // Legacy fields kept for downstream compatibility
  platforms: Set<Platform>;
  statuses: Set<TaskStatus>;
  showReviewOnly: boolean;
  // Tier filter: 0 = no tier, 1/2/3 = P1/P2/P3. Empty = show all.
  selectedTiers: Set<number>;
  // Platform spotlight
  spotlightPlatforms: Set<Platform>;
  intentGroup: IntentGroup;
  search: string;
  selectedDate: string | null;
}

export function getTimeGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= weekAgo) return "This Week";
  return "Earlier";
}

export function groupByTime(
  tasks: NodalTask[],
): { label: string; tasks: NodalTask[] }[] {
  const order = ["Today", "Yesterday", "This Week", "Earlier"];
  const groups: Record<string, NodalTask[]> = {};
  for (const t of tasks) {
    const g = getTimeGroup(t.updatedAt);
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  }
  return order
    .filter((l) => groups[l]?.length)
    .map((l) => ({ label: l, tasks: groups[l] }));
}
