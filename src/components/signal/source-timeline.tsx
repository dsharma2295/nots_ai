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
    <div className="relative ml-2 border-l border-zinc-800 pl-5">
      {events.map((evt) => (
        <div key={evt.id} className="relative mb-5 last:mb-0">
          {/* Timeline dot — colored by platform */}
          <div
            className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-900 ${
              evt.platform === "SLACK"
                ? "bg-purple-500"
                : evt.platform === "GMAIL"
                  ? "bg-red-500"
                  : evt.platform === "JIRA"
                    ? "bg-blue-500"
                    : "bg-zinc-500"
            }`}
          />

          <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/60 p-3">
            {/* Header */}
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px]">
              <PlatformBadge platform={evt.platform} />
              <span className="font-medium text-zinc-300">{evt.sender}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600">{formatTime(evt.timestamp)}</span>
            </div>

            {/* Content */}
            <p className="text-[13px] leading-relaxed text-zinc-400">
              {evt.rawContent}
            </p>

            {/* Attachments */}
            {evt.attachments.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {evt.attachments.map((att, j) => (
                  <a
                    key={j}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-800/50 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.986 3.014a2.25 2.25 0 0 0-3.182 0L3.47 8.348a3.25 3.25 0 0 0 4.596 4.596l4.334-4.334a.75.75 0 1 1 1.06 1.06l-4.333 4.335a4.75 4.75 0 0 1-6.718-6.718l5.334-5.334a3.75 3.75 0 1 1 5.304 5.304l-4.9 4.9a2.25 2.25 0 0 1-3.182-3.182L9.3 4.64a.75.75 0 1 1 1.06 1.06l-4.334 4.335a.75.75 0 0 0 1.06 1.06l4.9-4.9a2.25 2.25 0 0 0 0-3.182Z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
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
