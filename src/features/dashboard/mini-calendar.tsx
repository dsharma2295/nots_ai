"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function MiniCalendar({
  taskDates,
  selectedDate,
  onSelectAction,
}: {
  taskDates: Set<string>;
  selectedDate: string | null;
  onSelectAction: (date: string | null) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = viewDate.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

  function dateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
          {monthName}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) return <span key={i} className="h-6 w-6" />;
          const ds = dateStr(day);
          const hasTask = taskDates.has(ds);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          return (
            <button
              key={i}
              onClick={() => onSelectAction(isSelected ? null : ds)}
              className={`relative flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium transition-all duration-150 ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-sm"
                  : isToday
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : hasTask
                      ? "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      : "text-zinc-300 dark:text-zinc-500"
              }`}
            >
              {day}
              {hasTask && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button
          onClick={() => onSelectAction(null)}
          className="mt-2 w-full rounded-md py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}
