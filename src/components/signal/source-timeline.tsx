"use client";

import type { SourceEvent } from "@/lib/mock-data";
import { ExternalLink, Paperclip } from "lucide-react";
import { PlatformBadge, getPlatformDotColor } from "./platform-icon";

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
    <div className="relative pl-4">
      {/* Vertical gradient track */}
      <div className="absolute left-1.75 top-0 bottom-0 w-px bg-linear-to-b from-zinc-700 via-zinc-800 to-transparent" />

      {events.map((evt, i) => (
        <div
          key={evt.id}
          className="relative mb-4 last:mb-0"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Node dot — colored by platform */}
          <div
            className={`absolute -left-px top-6 h-2 w-2 rounded-full ring-4 ring-zinc-950 ${getPlatformDotColor(evt.platform)}`}
          />

          {/* Source card */}
          <div className="ml-6 rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-4 transition-colors duration-200 hover:bg-zinc-900/50">
            {/* Header */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={evt.platform} />
              <span className="text-sm font-medium text-zinc-200">
                {evt.sender}
              </span>
              <span className="ml-auto text-xs text-zinc-500">
                {formatTime(evt.timestamp)}
              </span>
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed text-zinc-400 line-clamp-4">
              {evt.rawContent}
            </p>

            {/* Attachments */}
            {evt.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {evt.attachments.map((att, j) => (
                  <a
                    key={j}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
                  >
                    <Paperclip className="h-3 w-3 text-zinc-500" />
                    {att.name}
                  </a>
                ))}
              </div>
            )}

            {/* Deep link */}
            <a
              href={evt.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-zinc-600 transition-colors duration-150 hover:text-zinc-400"
            >
              <ExternalLink className="h-3 w-3" />
              View original
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
