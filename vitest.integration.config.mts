// vitest.integration.config.mts
// Runs integration tests against real Neon DB.
// These are slower and hit the network — run separately.
//
// IMPORTANT: Uses pool "forks" with single thread to prevent
// parallel tests from stomping on each other's data.

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.integration.ts"],
    include: ["src/__tests__/integration/**/*.test.ts"],
    pool: "forks",
    sequence: {
      concurrent: false,
    },
    testTimeout: 30000, // Neon cold starts can take a few seconds
  },
});
