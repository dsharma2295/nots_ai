import type { NodalTask, Platform, TaskStatus } from "@/types";

export const ALL_PLATFORMS: Platform[] = ["SLACK", "GMAIL", "JIRA", "TRELLO", "ASANA"];
export const ALL_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"];

export interface Filters {
  platforms: Set<Platform>;
  statuses: Set<TaskStatus>;
  showReviewOnly: boolean;
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
