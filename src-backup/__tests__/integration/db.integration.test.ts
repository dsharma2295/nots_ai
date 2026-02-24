// src/lib/__tests__/db.integration.test.ts
// INTEGRATION TESTS: Real Neon DB operations.
// Tests the full data model — User, NodalTask, SourceEvent,
// TaskSourceLink, and Attachment — against your live schema.
//
// Run with: npm run test:integration

import { testDb } from "@/__tests__/setup.integration";
import { describe, expect, it } from "vitest";

// =============================================================
// HELPER: Create a test user (reused across tests)
// =============================================================
async function createTestUser(email = "test@nots.ai") {
  return testDb.user.create({
    data: { email, name: "Test User" },
  });
}

// =============================================================
// USER MODEL
// =============================================================
describe("User Model", () => {
  it("creates a user with cuid ID", async () => {
    const user = await createTestUser();

    expect(user.id).toBeDefined();
    expect(user.id.length).toBeGreaterThan(10); // cuid is ~25 chars
    expect(user.email).toBe("test@nots.ai");
    expect(user.name).toBe("Test User");
  });

  it("enforces unique email constraint", async () => {
    await createTestUser("dupe@nots.ai");

    await expect(createTestUser("dupe@nots.ai")).rejects.toThrow();
  });

  it("stores preferences as JSONB", async () => {
    const prefs = { noiseKeywords: ["thanks", "ok"], theme: "dark" };
    const user = await testDb.user.create({
      data: { email: "prefs@nots.ai", preferences: prefs },
    });

    const found = await testDb.user.findUnique({ where: { id: user.id } });
    expect(found?.preferences).toEqual(prefs);
  });
});

// =============================================================
// NODAL TASK MODEL
// =============================================================
describe("NodalTask Model", () => {
  it("creates a task with default values", async () => {
    const user = await createTestUser();
    const task = await testDb.nodalTask.create({
      data: {
        userId: user.id,
        title: "Finalize Q3 Budget",
        embeddingModel: "gemini-text-embedding-004",
      },
    });

    expect(task.priority).toBe("MEDIUM");
    expect(task.status).toBe("OPEN");
    expect(task.confidence).toBe(0);
    expect(task.needsReview).toBe(false);
    expect(task.embeddingModel).toBe("gemini-text-embedding-004");
  });

  it("cascades delete from user to tasks", async () => {
    const user = await createTestUser();
    await testDb.nodalTask.create({
      data: { userId: user.id, title: "Will be deleted" },
    });

    await testDb.user.delete({ where: { id: user.id } });

    const tasks = await testDb.nodalTask.findMany({
      where: { userId: user.id },
    });
    expect(tasks).toHaveLength(0);
  });

  it("supports all priority levels", async () => {
    const user = await createTestUser();
    const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

    for (const priority of priorities) {
      const task = await testDb.nodalTask.create({
        data: { userId: user.id, title: `Priority ${priority}`, priority },
      });
      expect(task.priority).toBe(priority);
    }
  });

  it("supports all status values", async () => {
    const user = await createTestUser();
    const statuses = [
      "OPEN",
      "IN_PROGRESS",
      "BLOCKED",
      "DONE",
      "ARCHIVED",
    ] as const;

    for (const status of statuses) {
      const task = await testDb.nodalTask.create({
        data: { userId: user.id, title: `Status ${status}`, status },
      });
      expect(task.status).toBe(status);
    }
  });
});

// =============================================================
// SOURCE EVENT MODEL (Provenance Ledger)
// =============================================================
describe("SourceEvent Model", () => {
  it("creates a source event with all fields", async () => {
    const event = await testDb.sourceEvent.create({
      data: {
        platform: "SLACK",
        rawContent: "Hey, can you review the budget deck?",
        deepLink: "slack://channel?team=T123&id=C456&message=789",
        sender: "alice@company.com",
        sourceHash: "sha256-abc123",
        timestamp: new Date("2026-02-01T10:00:00Z"),
        metadata: { mentionedUsers: ["bob"], hasAttachment: false },
      },
    });

    expect(event.platform).toBe("SLACK");
    expect(event.sourceHash).toBe("sha256-abc123");
    expect(event.metadata).toEqual({
      mentionedUsers: ["bob"],
      hasAttachment: false,
    });
  });

  it("enforces unique sourceHash (idempotency)", async () => {
    const hash = "sha256-duplicate-test";

    await testDb.sourceEvent.create({
      data: {
        platform: "GMAIL",
        rawContent: "First message",
        deepLink: "https://mail.google.com/thread/1",
        sourceHash: hash,
        timestamp: new Date(),
      },
    });

    // Same hash = same message. Must be rejected.
    await expect(
      testDb.sourceEvent.create({
        data: {
          platform: "GMAIL",
          rawContent: "Duplicate message",
          deepLink: "https://mail.google.com/thread/2",
          sourceHash: hash,
          timestamp: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it("supports all platform types", async () => {
    const platforms = [
      "SLACK",
      "GMAIL",
      "JIRA",
      "TRELLO",
      "ASANA",
      "MANUAL",
    ] as const;

    for (const platform of platforms) {
      const event = await testDb.sourceEvent.create({
        data: {
          platform,
          rawContent: `Event from ${platform}`,
          deepLink: `https://${platform.toLowerCase()}.example.com/123`,
          sourceHash: `hash-${platform}-${Date.now()}`,
          timestamp: new Date(),
        },
      });
      expect(event.platform).toBe(platform);
    }
  });
});

// =============================================================
// TASK SOURCE LINK (Many-to-Many Join Table)
// =============================================================
describe("TaskSourceLink Model", () => {
  async function createTaskAndEvent() {
    const user = await createTestUser();
    const task = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Test Task" },
    });
    const event = await testDb.sourceEvent.create({
      data: {
        platform: "SLACK",
        rawContent: "Test message",
        deepLink: "slack://test",
        sourceHash: `hash-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      },
    });
    return { user, task, event };
  }

  it("links a source event to a task with relevance score", async () => {
    const { task, event } = await createTaskAndEvent();

    const link = await testDb.taskSourceLink.create({
      data: {
        taskId: task.id,
        eventId: event.id,
        relevanceScore: 0.92,
      },
    });

    expect(link.relevanceScore).toBe(0.92);
    expect(link.dismissed).toBe(false);
    expect(link.humanVerified).toBe(false);
  });

  it("prevents duplicate task-event links", async () => {
    const { task, event } = await createTaskAndEvent();

    await testDb.taskSourceLink.create({
      data: { taskId: task.id, eventId: event.id, relevanceScore: 0.9 },
    });

    // Same task + same event = must fail on unique constraint
    await expect(
      testDb.taskSourceLink.create({
        data: { taskId: task.id, eventId: event.id, relevanceScore: 0.91 },
      }),
    ).rejects.toThrow();
  });

  it("allows one event to link to multiple tasks (many-to-many)", async () => {
    const user = await createTestUser();
    const task1 = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Budget Review" },
    });
    const task2 = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Client Onboarding" },
    });
    const event = await testDb.sourceEvent.create({
      data: {
        platform: "SLACK",
        rawContent: "Budget deck ready and onboarding doc is done",
        deepLink: "slack://multi-task",
        sourceHash: `hash-multi-${Date.now()}`,
        timestamp: new Date(),
      },
    });

    const link1 = await testDb.taskSourceLink.create({
      data: { taskId: task1.id, eventId: event.id, relevanceScore: 0.87 },
    });
    const link2 = await testDb.taskSourceLink.create({
      data: { taskId: task2.id, eventId: event.id, relevanceScore: 0.89 },
    });

    expect(link1.taskId).toBe(task1.id);
    expect(link2.taskId).toBe(task2.id);
    expect(link1.eventId).toBe(link2.eventId); // Same event, two tasks
  });

  it("supports soft delete (dismiss without losing data)", async () => {
    const { task, event, user } = await createTaskAndEvent();

    const link = await testDb.taskSourceLink.create({
      data: { taskId: task.id, eventId: event.id, relevanceScore: 0.86 },
    });

    // HITL reviewer dismisses the link
    const dismissed = await testDb.taskSourceLink.update({
      where: { id: link.id },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
        dismissedBy: user.id,
      },
    });

    expect(dismissed.dismissed).toBe(true);
    expect(dismissed.dismissedAt).toBeDefined();
    expect(dismissed.dismissedBy).toBe(user.id);

    // Link still exists in DB — it's soft-deleted, not gone
    const found = await testDb.taskSourceLink.findUnique({
      where: { id: link.id },
    });
    expect(found).not.toBeNull();
    expect(found?.dismissed).toBe(true);
  });

  it("cascades delete from task to links", async () => {
    const { task, event } = await createTaskAndEvent();

    await testDb.taskSourceLink.create({
      data: { taskId: task.id, eventId: event.id, relevanceScore: 0.9 },
    });

    await testDb.nodalTask.delete({ where: { id: task.id } });

    const links = await testDb.taskSourceLink.findMany({
      where: { taskId: task.id },
    });
    expect(links).toHaveLength(0);
  });
});

// =============================================================
// ATTACHMENT MODEL
// =============================================================
describe("Attachment Model", () => {
  it("creates an attachment linked to a source event", async () => {
    const event = await testDb.sourceEvent.create({
      data: {
        platform: "GMAIL",
        rawContent: "See attached budget",
        deepLink: "https://mail.google.com/thread/123",
        sourceHash: `hash-attach-${Date.now()}`,
        timestamp: new Date(),
      },
    });

    const attachment = await testDb.attachment.create({
      data: {
        eventId: event.id,
        name: "Q3_Budget.xlsx",
        url: "https://drive.google.com/file/abc123",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 245760,
      },
    });

    expect(attachment.name).toBe("Q3_Budget.xlsx");
    expect(attachment.mimeType).toContain("spreadsheet");
    expect(attachment.size).toBe(245760);
  });

  it("cascades delete from source event to attachments", async () => {
    const event = await testDb.sourceEvent.create({
      data: {
        platform: "SLACK",
        rawContent: "File shared",
        deepLink: "slack://file",
        sourceHash: `hash-cascade-${Date.now()}`,
        timestamp: new Date(),
      },
    });

    await testDb.attachment.create({
      data: {
        eventId: event.id,
        name: "design.pdf",
        url: "https://example.com/design.pdf",
      },
    });

    await testDb.sourceEvent.delete({ where: { id: event.id } });

    const attachments = await testDb.attachment.findMany({
      where: { eventId: event.id },
    });
    expect(attachments).toHaveLength(0);
  });
});

// =============================================================
// PGVECTOR (Embedding Storage)
// =============================================================
describe("pgvector Integration", () => {
  it("stores and retrieves a 768-dimension vector", async () => {
    const user = await createTestUser();

    // Create a task with an embedding via raw SQL
    // (Prisma doesn't natively support vector inserts)
    const embedding = Array.from({ length: 768 }, (_, i) => Math.sin(i * 0.01));
    const vectorStr = `[${embedding.join(",")}]`;

    const task = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Vector Test Task" },
    });

    await testDb.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      task.id,
    );

    // Verify the embedding was stored
    const result = await testDb.$queryRawUnsafe<{ dim: number }[]>(
      `SELECT vector_dims(embedding) as dim FROM nodal_tasks WHERE id = $1`,
      task.id,
    );

    expect(result[0].dim).toBe(768);
  });

  it("computes cosine similarity between two tasks", async () => {
    const user = await createTestUser();

    // Two similar vectors
    const embA = Array.from({ length: 768 }, () => 0.5);
    const embB = Array.from({ length: 768 }, () => 0.5);
    // One different vector
    const embC = Array.from({ length: 768 }, (_, i) => (i % 2 === 0 ? 1 : -1));

    const taskA = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Task A" },
    });
    const taskB = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Task B" },
    });
    const taskC = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Task C" },
    });

    const vecA = `[${embA.join(",")}]`;
    const vecB = `[${embB.join(",")}]`;
    const vecC = `[${embC.join(",")}]`;

    await testDb.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      vecA,
      taskA.id,
    );
    await testDb.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      vecB,
      taskB.id,
    );
    await testDb.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      vecC,
      taskC.id,
    );

    // Cosine distance: 0 = identical, 2 = opposite
    // 1 - distance = similarity
    const similarity = await testDb.$queryRawUnsafe<
      { sim_ab: number; sim_ac: number }[]
    >(`
      SELECT
        1 - (a.embedding <=> b.embedding) as sim_ab,
        1 - (a.embedding <=> c.embedding) as sim_ac
      FROM nodal_tasks a, nodal_tasks b, nodal_tasks c
      WHERE a.id = '${taskA.id}'
        AND b.id = '${taskB.id}'
        AND c.id = '${taskC.id}'
    `);

    // A and B are identical — similarity should be ~1.0
    expect(similarity[0].sim_ab).toBeCloseTo(1.0, 2);
    // A and C are different — similarity should be much lower
    expect(similarity[0].sim_ac).toBeLessThan(0.85);
  });

  it("finds tasks above the 0.85 similarity threshold", async () => {
    const user = await createTestUser();

    // Existing task with known embedding
    const existing = await testDb.nodalTask.create({
      data: { userId: user.id, title: "Existing Task" },
    });
    const embExisting = Array.from({ length: 768 }, () => 0.5);
    await testDb.$executeRawUnsafe(
      `UPDATE nodal_tasks SET embedding = $1::vector WHERE id = $2`,
      `[${embExisting.join(",")}]`,
      existing.id,
    );

    // New message — nearly identical embedding
    const newEmb = Array.from({ length: 768 }, () => 0.501);
    const newVec = `[${newEmb.join(",")}]`;

    // This is THE query your Orchestrator will run
    const matches = await testDb.$queryRawUnsafe<
      { id: string; title: string; similarity: number }[]
    >(
      `SELECT id, title, 1 - (embedding <=> $1::vector) as similarity
       FROM nodal_tasks
       WHERE embedding IS NOT NULL
         AND user_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      newVec,
      user.id,
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].similarity).toBeGreaterThan(0.85);
    expect(matches[0].id).toBe(existing.id);
  });
});
