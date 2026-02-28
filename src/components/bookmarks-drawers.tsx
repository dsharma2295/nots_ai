"use client";

// Client component: listens for sidebar drawer events,
// renders ResolvedDrawer and TrashDrawer with pre-fetched tasks.

import { ResolvedDrawer } from "@/features/drawers/resolved-drawer";
import { TrashDrawer } from "@/features/drawers/trash-drawer";
import type { NodalTask } from "@/lib/mock-data";
import { useEffect, useState } from "react";

export function BookmarksDrawers({
  resolvedTasks,
  trashedTasks,
}: {
  resolvedTasks: NodalTask[];
  trashedTasks: NodalTask[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    const openResolved = () => setDrawerOpen(true);
    const openTrash = () => setTrashOpen(true);
    window.addEventListener("nots:openResolved", openResolved);
    window.addEventListener("nots:openTrash", openTrash);
    return () => {
      window.removeEventListener("nots:openResolved", openResolved);
      window.removeEventListener("nots:openTrash", openTrash);
    };
  }, []);

  return (
    <>
      <ResolvedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tasks={resolvedTasks}
      />
      <TrashDrawer
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        tasks={trashedTasks}
      />
    </>
  );
}
