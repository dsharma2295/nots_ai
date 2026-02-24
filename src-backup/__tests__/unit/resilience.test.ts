// src/__tests__/unit/resilience.test.ts
// UNIT TESTS: Edge cases, error handling, and resilience.
// No real API calls — everything mocked.

import { classifyNoise, generateSourceHash } from "@/lib/gatekeeper";
import { describe, expect, it } from "vitest";

// =============================================================
// SLACK EDGE CASES
// =============================================================
describe("Slack Edge Cases", () => {
  it("handles messages with only URLs", () => {
    const result = classifyNoise("https://docs.google.com/spreadsheet/abc123");
    expect(result.allowed).toBe(true);
  });

  it("handles messages with code blocks", () => {
    const result = classifyNoise("```\nconst x = 42;\nconsole.log(x);\n```");
    expect(result.allowed).toBe(true);
  });

  it("handles messages with @mentions", () => {
    const result = classifyNoise("@U12345 can you review the PR?");
    expect(result.allowed).toBe(true);
  });

  it("handles very long messages", () => {
    const longMsg = "Review the budget deck. ".repeat(500); // ~12,000 chars
    const result = classifyNoise(longMsg);
    expect(result.allowed).toBe(true);
  });

  it("handles non-English characters", () => {
    const result = classifyNoise("プロジェクトの進捗を確認してください");
    expect(result.allowed).toBe(true);
  });

  it("handles mixed emoji + text (should pass)", () => {
    const result = classifyNoise(
      "🚨 Production is down! Check the logs immediately",
    );
    expect(result.allowed).toBe(true);
  });

  it("handles Slack formatted links", () => {
    const result = classifyNoise(
      "Check out <https://example.com|this link> for details",
    );
    expect(result.allowed).toBe(true);
  });

  it("handles multiline messages", () => {
    const result = classifyNoise(
      "Hey team,\n\nHere's the update:\n1. Budget approved\n2. Timeline shifted\n3. New hire starts Monday",
    );
    expect(result.allowed).toBe(true);
  });

  it("handles message with only whitespace and newlines", () => {
    const result = classifyNoise("   \n\n   \n   ");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SHORT_NOISE");
  });

  it("handles message with only special characters", () => {
    const result = classifyNoise("---");
    expect(result.allowed).toBe(false);
  });

  it("rejects 'ack' as noise", () => {
    const result = classifyNoise("ack");
    expect(result.allowed).toBe(false);
  });

  it("allows 'ack' when part of longer message", () => {
    const result = classifyNoise("I ack the issue and will fix it today");
    expect(result.allowed).toBe(true);
  });
});

// =============================================================
// SOURCE HASH CONSISTENCY
// =============================================================
describe("Source Hash Edge Cases", () => {
  it("handles empty content", () => {
    const hash = generateSourceHash("SLACK", "link", "");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles very long content", () => {
    const longContent = "x".repeat(100000);
    const hash = generateSourceHash("SLACK", "link", longContent);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles unicode content", () => {
    const hash = generateSourceHash("SLACK", "link", "こんにちは 🎉");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles special characters in deepLink", () => {
    const hash = generateSourceHash(
      "SLACK",
      "slack://channel?team=T123&id=C456&message=1234567890.123456",
      "hello",
    );
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

// =============================================================
// NOISE FILTER BOUNDARY CASES
// =============================================================
describe("Noise Filter Boundaries", () => {
  it("allows 4-character meaningful words", () => {
    expect(classifyNoise("help").allowed).toBe(true);
    expect(classifyNoise("bugs").allowed).toBe(true);
    expect(classifyNoise("task").allowed).toBe(true);
  });

  it("rejects 3-character non-acronyms", () => {
    expect(classifyNoise("hey").allowed).toBe(false);
    expect(classifyNoise("sup").allowed).toBe(false);
  });

  it("allows 3-character all-caps acronyms", () => {
    expect(classifyNoise("API").allowed).toBe(true);
    expect(classifyNoise("DNS").allowed).toBe(true);
    expect(classifyNoise("SQL").allowed).toBe(true);
  });

  it("allows 2-character all-caps acronyms", () => {
    expect(classifyNoise("P0").allowed).toBe(true);
    expect(classifyNoise("QA").allowed).toBe(true);
  });

  it("rejects 2-character lowercase", () => {
    expect(classifyNoise("hi").allowed).toBe(false);
    expect(classifyNoise("yo").allowed).toBe(false);
  });

  it("handles noise words with extra whitespace", () => {
    expect(classifyNoise("  thanks  ").allowed).toBe(false);
    expect(classifyNoise("\tok\n").allowed).toBe(false);
  });

  it("handles noise words with mixed case and punctuation", () => {
    expect(classifyNoise("Thanks!!!").allowed).toBe(false);
    expect(classifyNoise("OK.").allowed).toBe(false);
    expect(classifyNoise("COOL!").allowed).toBe(false);
  });
});

// =============================================================
// GEMINI JSON CLEANUP
// Simulates the cleanup logic without calling real API
// =============================================================
describe("Gemini JSON Cleanup", () => {
  function cleanGeminiResponse(text: string): string {
    return text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/:\s*undefined/g, ": null")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .trim();
  }

  it("strips markdown code fences", () => {
    const raw = '```json\n{"title": "test"}\n```';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: "test" });
  });

  it("replaces undefined with null", () => {
    const raw = '{"title": "test", "reason": undefined}';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: "test", reason: null });
  });

  it("fixes trailing commas in objects", () => {
    const raw = '{"title": "test", "intent": "review",}';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: "test", intent: "review" });
  });

  it("fixes trailing commas in arrays", () => {
    const raw = '{"items": ["a", "b", "c",]}';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ items: ["a", "b", "c"] });
  });

  it("handles clean JSON unchanged", () => {
    const raw = '{"title": "test", "confidence": 0.9}';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: "test", confidence: 0.9 });
  });

  it("handles multiple undefined values", () => {
    const raw = '{"a": undefined, "b": undefined, "c": "valid"}';
    const cleaned = cleanGeminiResponse(raw);
    expect(JSON.parse(cleaned)).toEqual({ a: null, b: null, c: "valid" });
  });
});

// =============================================================
// ORCHESTRATOR FAST PATHS
// =============================================================
describe("Orchestrator Fast Path Logic", () => {
  const THRESHOLD = 0.85;
  const SPREAD = 0.05;

  function decideAction(matches: { similarity: number }[]): string {
    if (matches.length === 0) return "CREATE";

    const top = matches[0];

    if (matches.length >= 2) {
      const second = matches[1];
      const spread = Math.abs(top.similarity - second.similarity);
      if (top.similarity >= THRESHOLD && spread < SPREAD) {
        return "REVIEW";
      }
    }

    if (top.similarity >= THRESHOLD) return "MERGE";
    if (top.similarity < THRESHOLD - 0.1) return "CREATE";

    return "GEMINI_NEEDED"; // Borderline — needs AI reasoning
  }

  it("CREATE when no matches", () => {
    expect(decideAction([])).toBe("CREATE");
  });

  it("MERGE when clear single match above threshold", () => {
    expect(decideAction([{ similarity: 0.92 }])).toBe("MERGE");
  });

  it("MERGE when top match above threshold, second below", () => {
    expect(decideAction([{ similarity: 0.91 }, { similarity: 0.72 }])).toBe(
      "MERGE",
    );
  });

  it("REVIEW when two matches above threshold within spread", () => {
    expect(decideAction([{ similarity: 0.89 }, { similarity: 0.87 }])).toBe(
      "REVIEW",
    );
  });

  it("CREATE when best match well below threshold", () => {
    expect(decideAction([{ similarity: 0.6 }])).toBe("CREATE");
  });

  it("GEMINI_NEEDED for borderline cases", () => {
    expect(decideAction([{ similarity: 0.8 }])).toBe("GEMINI_NEEDED");
    expect(decideAction([{ similarity: 0.78 }])).toBe("GEMINI_NEEDED");
  });

  it("exact threshold boundary — 0.85 is MERGE", () => {
    expect(decideAction([{ similarity: 0.85 }])).toBe("MERGE");
  });

  it("just below threshold — 0.849 needs Gemini", () => {
    expect(decideAction([{ similarity: 0.849 }])).toBe("GEMINI_NEEDED");
  });

  it("REVIEW not triggered when spread is exactly at threshold", () => {
    // spread = 0.05 exactly — NOT < 0.05, so no review
    expect(decideAction([{ similarity: 0.9 }, { similarity: 0.85 }])).toBe(
      "MERGE",
    ); // top is clear match
  });
});
