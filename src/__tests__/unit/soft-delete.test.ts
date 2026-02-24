// src/lib/__tests__/soft-delete.test.ts
// UNIT TESTS: Soft-delete filter injection logic.
// Mocked — no real DB. Tests the filter helper in isolation.

import { describe, expect, it, vi } from "vitest";

// =============================================================
// We're testing the filter injection logic directly.
// Extracted here to test without needing Prisma extensions.
// =============================================================

function injectDismissedFilter<T extends Record<string, unknown> | undefined>(
  where: T,
): T & { dismissed: boolean } {
  const existing = where ?? ({} as Record<string, unknown>);

  if ("dismissed" in existing) {
    console.warn(
      "[Nots.ai] Explicit `dismissed` filter detected on extended client. " +
        "Use db.$unrestricted for audit queries instead of overriding the filter.",
    );
    return existing as T & { dismissed: boolean };
  }

  return { ...existing, dismissed: false } as T & { dismissed: boolean };
}

describe("injectDismissedFilter", () => {
  it("injects dismissed: false into an empty where clause", () => {
    const result = injectDismissedFilter(undefined);
    expect(result).toEqual({ dismissed: false });
  });

  it("injects dismissed: false into an existing where clause", () => {
    const where = { taskId: "task-123", relevanceScore: 0.9 };
    const result = injectDismissedFilter(where);
    expect(result).toEqual({
      taskId: "task-123",
      relevanceScore: 0.9,
      dismissed: false,
    });
  });

  it("preserves all existing filters when injecting", () => {
    const where = {
      taskId: "task-123",
      humanVerified: true,
      relevanceScore: 0.85,
    };
    const result = injectDismissedFilter(where);
    expect(result.taskId).toBe("task-123");
    expect(result.humanVerified).toBe(true);
    expect(result.relevanceScore).toBe(0.85);
    expect(result.dismissed).toBe(false);
  });

  it("does NOT override an explicit dismissed filter", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const where = { taskId: "task-123", dismissed: true };
    const result = injectDismissedFilter(where);

    // Should keep the explicit value, not overwrite
    expect(result.dismissed).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Explicit `dismissed` filter detected"),
    );
  });

  it("logs a warning when explicit dismissed filter is used", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    injectDismissedFilter({ dismissed: false });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("db.$unrestricted"),
    );
  });

  it("handles empty object where clause", () => {
    const result = injectDismissedFilter({});
    expect(result).toEqual({ dismissed: false });
  });
});
