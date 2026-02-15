"use client";

export function TaskCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-900/30"
      style={{
        animation: "cardSlideIn 0.4s ease-out backwards",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800/60" />
        <div className="h-3 w-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/40" />
        <div className="ml-auto h-3 w-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/30" />
      </div>
      <div className="mb-3 space-y-2">
        <div className="h-4 w-[85%] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800/50" />
        <div className="h-4 w-[45%] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/30" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700/60" />
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-700/40" />
        </div>
        <div className="h-3 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/30" />
      </div>
    </div>
  );
}
