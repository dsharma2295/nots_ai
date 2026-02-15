"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({
  intervalSeconds = 15,
}: {
  intervalSeconds?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [router, intervalSeconds]);

  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 ring-1 ring-emerald-500/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-medium text-emerald-400">Live</span>
    </div>
  );
}
