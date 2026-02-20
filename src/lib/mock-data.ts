// =============================================================
// src/lib/mock-data.ts
// Type definitions + mock data for the dashboard.
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
  tier: number; // 1 = Gold (P1), 2 = Silver (P2), 3 = Bronze/default (P3)
  bookmarked: boolean;
  seenEventCount: number;
  createdAt: string;
  updatedAt: string;
  sourceEvents: SourceEvent[];
  noteCount: number;
  trashedAt: string | null;
  hasBeenOpened: boolean;
}

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
        rawContent:
          "Hey team, can someone review the Q3 budget deck by Friday? I've attached the latest numbers and we need sign-off before the board meeting next week.",
        deepLink: "slack://channel?team=T123&id=C456&message=1707300900",
        sender: "Sarah Chen",
        timestamp: "2026-02-07T09:15:00Z",
        attachments: [
          {
            name: "Q3_Budget_v3.xlsx",
            url: "https://drive.google.com/file/d/abc123",
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      },
      {
        id: "evt-002",
        platform: "SLACK",
        rawContent:
          "Here's my feedback on the Q3 budget deck. The revenue projections in slide 4 look too optimistic. Can we revise before Friday's deadline?",
        deepLink: "slack://channel?team=T123&id=C456&message=1707305400",
        sender: "Mike Rodriguez",
        timestamp: "2026-02-07T10:30:00Z",
        attachments: [],
      },
      {
        id: "evt-003",
        platform: "GMAIL",
        rawContent:
          "Hi Divyanshu, attaching the revised revenue model for the Q3 deck. Please incorporate these numbers before the Friday review.",
        deepLink: "https://mail.google.com/mail/u/0/#inbox/thread-abc123",
        sender: "finance@company.com",
        timestamp: "2026-02-07T11:45:00Z",
        attachments: [
          {
            name: "Revenue_Model_Q3_Revised.pdf",
            url: "https://drive.google.com/file/d/def456",
            mimeType: "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "task-002",
    title: "Schedule Onboarding for New Hire — Monday Start",
    intent: "task-assignment",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    confidence: 0.9,
    needsReview: false,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-07T08:00:00Z",
    updatedAt: "2026-02-07T14:20:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,
    sourceEvents: [
      {
        id: "evt-004",
        platform: "SLACK",
        rawContent:
          "We need to schedule the onboarding session for the new hire starting Monday. Can you set up the IT access and welcome kit?",
        deepLink: "slack://channel?team=T123&id=C789&message=1707296400",
        sender: "HR Team",
        timestamp: "2026-02-07T08:00:00Z",
        attachments: [],
      },
      {
        id: "evt-005",
        platform: "JIRA",
        rawContent:
          "ONBOARD-42: Set up IT access, Slack channels, and welcome kit for new team member Alex starting Feb 10.",
        deepLink: "https://company.atlassian.net/browse/ONBOARD-42",
        sender: "Jira (assigned to you)",
        timestamp: "2026-02-07T09:30:00Z",
        attachments: [],
      },
      {
        id: "evt-006",
        platform: "GMAIL",
        rawContent:
          "Calendar Invite: New Hire Onboarding — Alex Park\nMonday Feb 10, 10:00 AM — 12:00 PM\nConference Room B",
        deepLink: "https://calendar.google.com/event/xyz789",
        sender: "Google Calendar",
        timestamp: "2026-02-07T14:20:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "task-003",
    title: "Fix Authentication Bug — Login Timeout on Mobile",
    intent: "bug-fix",
    priority: "CRITICAL",
    status: "OPEN",
    confidence: 0.92,
    needsReview: false,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-07T07:30:00Z",
    updatedAt: "2026-02-07T13:00:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,

    sourceEvents: [
      {
        id: "evt-007",
        platform: "JIRA",
        rawContent:
          "BUG-1337: Users on iOS are experiencing login timeouts after the v2.4 release. P0 — blocking 15% of mobile users.",
        deepLink: "https://company.atlassian.net/browse/BUG-1337",
        sender: "QA Team",
        timestamp: "2026-02-07T07:30:00Z",
        attachments: [],
      },
      {
        id: "evt-008",
        platform: "SLACK",
        rawContent:
          "@divyanshu This is urgent — the mobile login bug is affecting paying customers. Can you take point on this today? I've pulled the crash logs.",
        deepLink: "slack://channel?team=T123&id=C101&message=1707298200",
        sender: "Lisa Park (Engineering Lead)",
        timestamp: "2026-02-07T08:30:00Z",
        attachments: [
          {
            name: "crash_logs_ios_v2.4.txt",
            url: "https://files.slack.com/crash_logs.txt",
            mimeType: "text/plain",
          },
        ],
      },
      {
        id: "evt-009",
        platform: "SLACK",
        rawContent:
          "Update: Narrowed it down to the OAuth token refresh logic. The timeout is set to 3s but the token endpoint is averaging 4.2s on cellular. Working on a fix.",
        deepLink: "slack://channel?team=T123&id=C101&message=1707314400",
        sender: "You",
        timestamp: "2026-02-07T13:00:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "task-004",
    title: "Prepare Investor Pitch Deck — Series A",
    intent: "document-review",
    priority: "HIGH",
    status: "BLOCKED",
    confidence: 0.88,
    needsReview: false,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-06T16:00:00Z",
    updatedAt: "2026-02-07T11:00:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,

    sourceEvents: [
      {
        id: "evt-010",
        platform: "GMAIL",
        rawContent:
          "Hey Divyanshu, we have the Series A pitch meeting with Sequoia on Feb 14. I need the updated TAM slide and competitive analysis by Wednesday EOD.",
        deepLink: "https://mail.google.com/mail/u/0/#inbox/thread-pitch001",
        sender: "CEO <ceo@startup.com>",
        timestamp: "2026-02-06T16:00:00Z",
        attachments: [],
      },
      {
        id: "evt-011",
        platform: "SLACK",
        rawContent:
          "Blocked on the pitch deck — waiting for the latest ARR numbers from finance. @finance-team can you share the Jan actuals?",
        deepLink: "slack://channel?team=T123&id=C202&message=1707310800",
        sender: "You",
        timestamp: "2026-02-07T11:00:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "task-005",
    title: "Weekly Team Standup — Prepare Updates",
    intent: "meeting-request",
    priority: "LOW",
    status: "OPEN",
    confidence: 0.85,
    needsReview: false,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-07T08:00:00Z",
    updatedAt: "2026-02-07T08:00:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,

    sourceEvents: [
      {
        id: "evt-012",
        platform: "GMAIL",
        rawContent:
          "Calendar Invite: Weekly Engineering Standup\nEvery Monday, 9:30 AM — 9:45 AM\nZoom link: https://zoom.us/j/123456",
        deepLink: "https://calendar.google.com/event/standup-weekly",
        sender: "Google Calendar",
        timestamp: "2026-02-07T08:00:00Z",
        attachments: [],
      },
    ],
  },
  {
    id: "task-006",
    title: "Review PR #482 — Database Migration Script",
    intent: "document-review",
    priority: "MEDIUM",
    status: "OPEN",
    confidence: 0.7,
    needsReview: true,
    tier: 3,
    bookmarked: false,
    seenEventCount: 0,
    createdAt: "2026-02-07T12:00:00Z",
    updatedAt: "2026-02-07T12:00:00Z",
    noteCount: 0,
    trashedAt: null,
    hasBeenOpened: false,

    sourceEvents: [
      {
        id: "evt-013",
        platform: "SLACK",
        rawContent:
          "@divyanshu I opened PR #482 for the migration script. Can you review when you get a chance? No rush but ideally before Wed.",
        deepLink: "slack://channel?team=T123&id=C303&message=1707312000",
        sender: "Junior Dev (Alex)",
        timestamp: "2026-02-07T12:00:00Z",
        attachments: [],
      },
    ],
  },
];
