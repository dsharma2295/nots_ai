"use client";

import type { SourceEvent } from "@/lib/mock-data";
import { ArrowUpRight, Paperclip } from "lucide-react";
import { PlatformBadge, getPlatformDotClass } from "./platform-icon";

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
    <div className="relative ml-1 pl-5">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800/60" />

      {events.map((evt, i) => (
        <div
          key={evt.id}
          className="relative mb-3 last:mb-0"
          style={{
            animation: "fadeSlideIn 0.3s ease-out backwards",
            animationDelay: `${i * 80}ms`,
          }}
        >
          <div
            className={`absolute -left-3.75 top-4 h-2.5 w-2.5 rounded-full ring-[3px] ring-white dark:ring-[#0a0a0f] ${getPlatformDotClass(evt.platform)}`}
          />

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3.5 transition-all duration-200 hover:border-zinc-200 dark:border-zinc-800/50 dark:bg-[#0f0f18] dark:hover:border-zinc-700/60">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={evt.platform} />
              <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {evt.sender}
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600">
                {formatTime(evt.timestamp)}
              </span>
            </div>

            <p className="text-[13px] leading-[1.6] text-zinc-600 line-clamp-3 dark:text-zinc-400">
              {evt.rawContent}
            </p>

            {evt.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {evt.attachments.map((att, j) => (
                  <a
                    key={j}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    // RIGHT - Use a template literal (backticks)
                    className={`group/att inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-all duration-200
            bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-200 hover:text-zinc-900
            dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-zinc-700/30 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200`}
                  >
                    <Paperclip className="h-3 w-3 opacity-50 transition-opacity group-hover/att:opacity-100" />
                    {att.name}
                  </a>
                ))}
              </div>
            )}

            <a
              href={evt.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-zinc-400 transition-colors duration-200 hover:text-indigo-500 dark:text-zinc-600 dark:hover:text-indigo-400"
            >
              Open source
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      ))}

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
