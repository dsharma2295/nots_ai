// =============================================================
// scripts/e2e-test.ts
// End-to-End Pipeline Test — Real Gemini + Real Neon DB
//
// Simulates 3 messages:
//   1. "Review the Q3 budget deck by Friday" → should CREATE
//   2. "Budget deck feedback attached" → should MERGE (same topic)
//   3. "Schedule onboarding for new hire" → should CREATE (new topic)
//
// Then sends noise to verify Gatekeeper filtering.
//
// Run with: npx tsx scripts/e2e-test.ts
// =============================================================

import "dotenv/config";
import { findSimilarTasks, orchestrate } from "../src/lib/agents/orchestrator";
import { refineWithEmbedding } from "../src/lib/agents/refiner";
import db from "../src/lib/db";
import { classifyNoise, generateSourceHash } from "../src/lib/gatekeeper";
import {
  CreateNodalTaskSchema,
  CreateSourceEventSchema,
  CreateTaskSourceLinkSchema,
  UniversalTaskSchema,
  type UniversalTask,
} from "../src/lib/validators/schemas";

// =============================================================
// HELPERS
// =============================================================

function log(label: string, data: unknown) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(60));
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

function makeTask(text: string, index: number): UniversalTask {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return UniversalTaskSchema.parse({
    platform: "SLACK",
    rawContent: text,
    sender: "alice@company.com",
    deepLink: `slack://channel?team=T123&id=C456&message=${runId}-${index}`,
    timestamp: new Date().toISOString(),
    sourceHash: generateSourceHash(
      "SLACK",
      `slack://msg-${runId}-${index}`,
      text,
    ),
  });
}

// =============================================================
// MAIN PIPELINE (mirrors what Inngest does, but synchronous)
// =============================================================

async function processMessage(
  task: UniversalTask,
  userId: string,
  label: string,
) {
  log(`${label} — GATEKEEPER`, "Checking noise...");

  // Step 0: Gatekeeper noise check
  const noiseResult = classifyNoise(task.rawContent, task.sender);
  if (!noiseResult.allowed) {
    log(`${label} — REJECTED`, noiseResult);
    return null;
  }
  console.log("  ✅ Passed Gatekeeper");

  // Step 1: Refine + Embed
  log(`${label} — REFINER + EMBEDDING`, "Calling Gemini...");
  const startRefine = Date.now();
  const { refinerOutput, embedding } = await refineWithEmbedding(task);
  const refineTime = Date.now() - startRefine;

  console.log(`  ⏱  Refine + Embed: ${refineTime}ms`);
  console.log(`  📝 Smart Title: "${refinerOutput.smartTitle}"`);
  console.log(`  🎯 Intent: ${refinerOutput.intent}`);
  console.log(`  ⚡ Priority: ${refinerOutput.suggestedPriority}`);
  console.log(`  🔮 Confidence: ${refinerOutput.confidence}`);
  console.log(`  📐 Embedding dimensions: ${embedding.length}`);

  if (refinerOutput.isNoise) {
    log(`${label} — NOISE (Refiner)`, refinerOutput.noiseReason);
    return null;
  }

  // Step 2: Vector Search
  log(`${label} — VECTOR SEARCH`, "Searching existing tasks...");
  const startSearch = Date.now();
  const vectorMatches = await findSimilarTasks(embedding, userId, db);
  const searchTime = Date.now() - startSearch;

  console.log(`  ⏱  Vector Search: ${searchTime}ms`);
  if (vectorMatches.length === 0) {
    console.log("  📭 No existing tasks found");
  } else {
    vectorMatches.forEach((m, i) => {
      console.log(
        `  ${i + 1}. "${m.title}" — similarity: ${m.similarity.toFixed(4)}`,
      );
    });
  }

  // Step 3: Orchestrate
  log(`${label} — ORCHESTRATOR`, "Deciding action...");
  const startOrch = Date.now();
  const decision = await orchestrate({
    refinerOutput,
    rawContent: task.rawContent,
    vectorMatches,
  });
  const orchTime = Date.now() - startOrch;

  console.log(`  ⏱  Orchestrate: ${orchTime}ms`);
  console.log(`  🎬 Action: ${decision.action}`);
  console.log(`  💪 Confidence: ${decision.confidence}`);
  console.log(`  💬 Reasoning: ${decision.reasoning}`);

  // Step 4: Write to DB
  log(`${label} — DB WRITE`, `Executing ${decision.action}...`);

  const sourceEvent = await db.sourceEvent.create({
    data: CreateSourceEventSchema.parse({
      platform: task.platform,
      rawContent: task.rawContent,
      deepLink: task.deepLink,
      sender: task.sender,
      sourceHash: task.sourceHash,
      metadata: task.metadata,
      timestamp: task.timestamp,
    }),
  });

  if (decision.action === "CREATE") {
    const nodalTask = await db.nodalTask.create({
      data: CreateNodalTaskSchema.parse({
        userId,
        title: decision.newTaskTitle ?? refinerOutput.smartTitle,
        intent: refinerOutput.intent,
        priority: refinerOutput.suggestedPriority,
        confidence: decision.confidence,
        needsReview: false,
      }),
    });

    const vectorStr = `[${embedding.join(",")}]`;
    await db.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      nodalTask.id,
    );

    await db.taskSourceLink.create({
      data: CreateTaskSourceLinkSchema.parse({
        taskId: nodalTask.id,
        eventId: sourceEvent.id,
        relevanceScore: decision.confidence,
      }),
    });

    console.log(
      `  ✅ Created NodalTask: "${nodalTask.title}" (${nodalTask.id})`,
    );
    return { action: "CREATE", taskId: nodalTask.id, title: nodalTask.title };
  }

  if (decision.action === "MERGE" && decision.mergeTargetId) {
    await db.taskSourceLink.create({
      data: CreateTaskSourceLinkSchema.parse({
        taskId: decision.mergeTargetId,
        eventId: sourceEvent.id,
        relevanceScore: decision.similarityScore ?? decision.confidence,
      }),
    });

    const vectorStr = `[${embedding.join(",")}]`;
    await db.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector, updated_at = NOW() WHERE id = $2`,
      vectorStr,
      decision.mergeTargetId,
    );

    console.log(`  ✅ Merged into task: ${decision.mergeTargetId}`);
    return { action: "MERGE", taskId: decision.mergeTargetId };
  }

  // REVIEW
  const nodalTask = await db.nodalTask.create({
    data: CreateNodalTaskSchema.parse({
      userId,
      title: decision.newTaskTitle ?? refinerOutput.smartTitle,
      intent: refinerOutput.intent,
      priority: refinerOutput.suggestedPriority,
      confidence: decision.confidence,
      needsReview: true,
    }),
  });

  const vectorStr = `[${embedding.join(",")}]`;
  await db.$executeRawUnsafe(
    `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    nodalTask.id,
  );

  await db.taskSourceLink.create({
    data: CreateTaskSourceLinkSchema.parse({
      taskId: nodalTask.id,
      eventId: sourceEvent.id,
      relevanceScore: decision.confidence,
    }),
  });

  console.log(
    `  ⚠️  Flagged for REVIEW: "${nodalTask.title}" (${nodalTask.id})`,
  );
  return { action: "REVIEW", taskId: nodalTask.id, title: nodalTask.title };
}

// =============================================================
// RUN
// =============================================================

async function main() {
  console.log("\n🚀 Nots.ai End-to-End Pipeline Test\n");
  console.log("Models:");
  console.log(
    `  Refiner: ${process.env.GEMINI_REFINER_MODEL || "gemini-2.5-flash-lite"}`,
  );
  console.log(`  Embedding: gemini-embedding-001 (768d)`);

  // Create a test user
  const user = await db.user.create({
    data: {
      email: `e2e-test-${Date.now()}@nots.ai`,
      name: "E2E Test User",
    },
  });
  console.log(`\n👤 Test user: ${user.id}`);

  const results: Awaited<ReturnType<typeof processMessage>>[] = [];

  // -----------------------------------------------------------
  // MESSAGE 1: Should CREATE a new task
  // -----------------------------------------------------------
  const msg1 = makeTask(
    "Hey team, can someone review the Q3 budget deck by Friday? I've attached the latest numbers and we need sign-off before the board meeting next week.",
    1,
  );
  results.push(await processMessage(msg1, user.id, "MSG 1 (Budget Review)"));

  // Small delay to avoid rate limiting
  await new Promise((r) => setTimeout(r, 2000));

  // -----------------------------------------------------------
  // MESSAGE 2: Should MERGE into the budget task
  // -----------------------------------------------------------
  const msg2 = makeTask(
    "Here's my feedback on the Q3 budget deck. The revenue projections in slide 4 look too optimistic. Can we revise before Friday's deadline?",
    2,
  );
  results.push(await processMessage(msg2, user.id, "MSG 2 (Budget Feedback)"));

  await new Promise((r) => setTimeout(r, 2000));

  // -----------------------------------------------------------
  // MESSAGE 3: Should CREATE a different task
  // -----------------------------------------------------------
  const msg3 = makeTask(
    "We need to schedule the onboarding session for the new hire starting Monday. Can you set up the IT access and welcome kit?",
    3,
  );
  results.push(
    await processMessage(msg3, user.id, "MSG 3 (New Hire Onboarding)"),
  );

  // -----------------------------------------------------------
  // NOISE TESTS: Should be rejected by Gatekeeper
  // -----------------------------------------------------------
  log("NOISE TEST 1", "Testing 'thanks' →");
  const noise1 = classifyNoise("thanks");
  console.log(
    `  ${noise1.allowed ? "❌ FAILED" : "✅ Blocked"}: ${noise1.reason}`,
  );

  log("NOISE TEST 2", "Testing '👍' →");
  const noise2 = classifyNoise("👍");
  console.log(
    `  ${noise2.allowed ? "❌ FAILED" : "✅ Blocked"}: ${noise2.reason}`,
  );

  log("NOISE TEST 3", "Testing bot message →");
  const noise3 = classifyNoise("Deploy #4521 succeeded", "github-bot");
  console.log(
    `  ${noise3.allowed ? "❌ FAILED" : "✅ Blocked"}: ${noise3.reason}`,
  );

  // -----------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------
  log("SUMMARY", "");
  results.forEach((r, i) => {
    if (r) {
      console.log(
        `  MSG ${i + 1}: ${r.action} → ${"title" in r ? r.title : r.taskId}`,
      );
    } else {
      console.log(`  MSG ${i + 1}: FILTERED`);
    }
  });

  // Verify DB state
  const taskCount = await db.nodalTask.count({ where: { userId: user.id } });
  const eventCount = await db.sourceEvent.count();
  const linkCount = await db.taskSourceLink.count();

  console.log(`\n📊 Database State:`);
  console.log(`  Nodal Tasks: ${taskCount}`);
  console.log(`  Source Events: ${eventCount}`);
  console.log(`  Task-Source Links: ${linkCount}`);

  // Expected:
  // - 2 or 3 Nodal Tasks (MSG1=CREATE, MSG2=MERGE or CREATE, MSG3=CREATE)
  // - 3 Source Events
  // - 3 Task-Source Links

  // Cleanup test data
  console.log("\n🧹 Cleaning up test data...");
  await db.$executeRawUnsafe(
    `DELETE FROM attachments WHERE event_id IN (SELECT id FROM source_events)`,
  );
  await db.$executeRawUnsafe(`DELETE FROM task_source_links`);
  await db.$executeRawUnsafe(`DELETE FROM source_events`);
  await db.$executeRawUnsafe(
    `DELETE FROM nodal_tasks WHERE user_id = $1`,
    user.id,
  );
  await db.$executeRawUnsafe(`DELETE FROM users WHERE id = $1`, user.id);
  console.log("  ✅ Cleaned up");

  console.log("\n✨ E2E test complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n💥 E2E test failed:", e);
    process.exit(1);
  });
