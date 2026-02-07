// vitest.config.mts
// Drop this at the project root next to package.json.
//
// TWO test pools:
//   1. Unit tests (default): Mocked Prisma, no DB, runs in milliseconds.
//   2. Integration tests: Real Neon DB, tests actual queries.
//      Run separately with `npm run test:integration`.

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: [
      "src/__tests__/unit/**/*.test.ts",
      "src/__tests__/unit/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/inngest/**"],
    },
  },
});
