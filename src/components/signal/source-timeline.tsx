"use client";

import type { SourceEvent } from "@/lib/mock-data";
import { ArrowUpRight, Paperclip } from "lucide-react";
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
    <div className="relative ml-1 pl-5">
      {/* Track */}
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-linear-to-b from-zinc-700/60 via-zinc-800/40 to-transparent" />

      {events.map((evt, i) => (
        <div
          key={evt.id}
          className="relative mb-3 last:mb-0"
          style={{
            animation: "fadeSlideIn 0.3s ease-out backwards",
            animationDelay: `${i * 80}ms`,
          }}
        >
          {/* Dot */}
          <div
            className={`absolute -left-[15px] top-4 h-2.5 w-2.5 rounded-full ring-[3px] ring-[#0a0a0f] ${getPlatformDotColor(evt.platform)}`}
          />

          {/* Card */}
          <div className="rounded-lg border border-zinc-800/50 bg-[#0f0f18] p-3.5 transition-all duration-200 hover:border-zinc-700/60 hover:bg-[#12121e]">
            {/* Header */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={evt.platform} />
              <span className="text-[13px] font-medium text-zinc-200">
                {evt.sender}
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-zinc-600">
                {formatTime(evt.timestamp)}
              </span>
            </div>

            {/* Body */}
            <p className="text-[13px] leading-[1.6] text-zinc-400 line-clamp-3">
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
                    className="group/att inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/40 px-2.5 py-1.5 text-[11px] text-zinc-400 ring-1 ring-zinc-700/30 transition-all duration-200 hover:bg-zinc-800/70 hover:text-zinc-200 hover:ring-zinc-600/40"
                  >
                    <Paperclip className="h-3 w-3 text-zinc-600 transition-colors group-hover/att:text-zinc-400" />
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
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-zinc-600 transition-colors duration-200 hover:text-indigo-400"
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
