// =============================================================
// src/inngest/functions/renew-gmail-watch.ts
// Gmail Pub/Sub watch expires every 7 days.
// This cron renews it every 6 days so it never lapses.
// =============================================================

import { setupGmailWatch } from "@/lib/gmail/client";
import { inngest } from "../client";

export const renewGmailWatch = inngest.createFunction(
  { id: "renew-gmail-watch" },
  { cron: "0 0 */6 * *" }, // Every 6 days at midnight
  async ({ step }) => {
    const result = await step.run("renew-watch", async () => {
      try {
        const watchData = await setupGmailWatch();
        return { status: "renewed", data: watchData };
      } catch (error) {
        console.error("[Gmail Watch] Renewal failed:", error);
        return {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    return result;
  },
);
