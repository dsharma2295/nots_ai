import { SignalStream } from "@/components/signal/signal-stream";
import { MOCK_TASKS } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <SignalStream tasks={MOCK_TASKS} />
    </main>
  );
}
