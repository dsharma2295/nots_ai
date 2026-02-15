"use client";

export function TaskCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Meta row */}
      <div className="mb-2 flex items-center gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-14 animate-pulse rounded bg-zinc-800/60" />
        <div className="ml-auto h-3 w-8 animate-pulse rounded bg-zinc-800/40" />
      </div>

      {/* Title */}
      <div className="mb-3 space-y-1.5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-800/60" />
      </div>

      {/* Bottom meta */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-700" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-700" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-zinc-800/40" />
        <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/30" />
      </div>
    </div>
  );
}
