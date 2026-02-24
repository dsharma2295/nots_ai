// =============================================================
// src/lib/agents/gemini.ts
// Shared Gemini client + model configuration.
//
// WHY CENTRALIZED: Every agent needs a Gemini client. If you
// change models (Flash → Pro, or swap to a different provider),
// you change ONE file, not every agent.
//
// MODEL STRATEGY (zero-budget):
//   - Refiner: gemini-2.5-flash (fast, cheap, high-volume extraction)
//   - Orchestrator: gemini-2.5-flash (same model — Pro is expensive)
//   - Embeddings: gemini-embedding-001 (768d via outputDimensionality)
//
// Switch to Pro for Orchestrator when you have budget.
// =============================================================

import { GoogleGenAI } from "@google/genai";

// Singleton client — reuse across all agents
let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey",
      );
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

// =============================================================
// MODEL CONFIGURATION
// Change these when switching models or providers.
// Your PRD says "Gemini 3 Flash/Pro" — use preview models
// when available, fall back to 2.5-flash for stability.
// =============================================================

export const MODELS = {
  refiner: process.env.GEMINI_REFINER_MODEL || "gemini-2.0-flash",
  orchestrator: process.env.GEMINI_ORCHESTRATOR_MODEL || "gemini-2.0-flash",
  embedding: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
} as const;

// Embedding output dimensions — must match your pgvector column: vector(768)
export const EMBEDDING_DIMENSIONS = 768;

// The 0.85 cosine similarity threshold from your PRD
export const SIMILARITY_THRESHOLD = 0.85;

// Below this confidence, flag for HITL review
export const REVIEW_CONFIDENCE_THRESHOLD = 0.7;

// If two task matches are within this spread, flag as ambiguous
export const AMBIGUOUS_SPREAD_THRESHOLD = 0.05;

// =============================================================
// GENERATE EMBEDDING
// Returns a 768-dimension float array for a given text.
// Uses gemini-embedding-001 with MRL truncation to 768d.
// =============================================================

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGeminiClient();
  const result = await client.models.embedContent({
    model: MODELS.embedding,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = result.embeddings?.[0]?.values;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding failed: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding?.length ?? 0}`,
    );
  }

  return embedding;
}

// =============================================================
// GENERATE CONTENT (JSON mode)
// Calls Gemini with a system prompt and expects JSON back.
// Strips markdown fences if Gemini wraps the response.
// =============================================================

export async function generateJSON<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";

  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/:\s*undefined/g, ": null")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Gemini returned invalid JSON.\nModel: ${model}\nRaw response: ${text.slice(0, 500)}`,
    );
  }
}
