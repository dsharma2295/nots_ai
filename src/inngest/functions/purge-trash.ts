// =============================================================
// src/inngest/functions/purge-trash.ts
// Inngest Cron — Permanently deletes tasks in TRASHED status
// that are older than 30 days. Runs daily at 3:00 AM UTC.
// =============================================================

import db from "@/lib/db";
import { inngest } from "../client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const purgeTrash = inngest.createFunction(
  {
    id: "purge-trash",
    retries: 2,
  },
  { cron: "0 3 * * *" }, // Daily at 3:00 AM UTC
  async ({ step }) => {
    const result = await step.run("purge-old-trashed-tasks", async () => {
      const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

      // Find tasks trashed more than 30 days ago
      const stale = await db.nodalTask.findMany({
        where: {
          status: "TRASHED",
          trashedAt: { lte: cutoff },
        },
        select: { id: true },
      });

      if (stale.length === 0) {
        return { purged: 0 };
      }

      const ids = stale.map((t) => t.id);

      // Delete in order: notes → source links → tasks
      await db.note.deleteMany({ where: { taskId: { in: ids } } });
      await db.taskSourceLink.deleteMany({ where: { taskId: { in: ids } } });
      await db.nodalTask.deleteMany({ where: { id: { in: ids } } });

      return { purged: ids.length };
    });

    return result;
  },
);
