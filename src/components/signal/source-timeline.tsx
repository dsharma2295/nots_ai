"use client";

import type { SourceEvent } from "@/lib/mock-data";
import { PlatformBadge } from "./platform-icon";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function SourceTimeline({ events }: { events: SourceEvent[] }) {
  return (
    <div className="relative ml-3 border-l-2 border-zinc-200 pl-6 dark:border-zinc-700">
      {events.map((evt, i) => (
        <div key={evt.id} className="relative mb-6 last:mb-0">
          {/* Timeline dot */}
          <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-zinc-300 dark:border-zinc-900 dark:bg-zinc-600" />

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header: platform + sender + time */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <PlatformBadge platform={evt.platform} />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {evt.sender}
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {formatTime(evt.timestamp)}
              </span>
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {evt.rawContent}
            </p>

            {/* Attachments */}
            {evt.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {evt.attachments.map((att, j) => (
                  <a
                    key={j}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    <span>📎</span>
                    {att.name}
                  </a>
                ))}
              </div>
            )}

            {/* Deep link */}
            <div className="mt-2">
              <a
                href={evt.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
              >
                View original →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
