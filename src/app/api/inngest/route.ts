import { inngest } from "@/inngest/client";
import { helloWorld } from "@/inngest/functions";
import { processMessage } from "@/inngest/functions/process-message";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, processMessage],
});
