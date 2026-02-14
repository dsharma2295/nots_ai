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
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </div>
  );
}
