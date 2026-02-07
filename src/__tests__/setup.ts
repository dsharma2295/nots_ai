// src/__tests__/setup.ts
// Global setup for UNIT tests (mocked, no real DB).

import { beforeEach, vi } from "vitest";

// Reset all mocks between tests to prevent leakage
beforeEach(() => {
  vi.restoreAllMocks();
});
