// src/__tests__/setup.integration.ts
// Global setup for INTEGRATION tests (real Neon DB).
//
// Loads .env so DATABASE_URL is available.
// Cleans all tables between tests in dependency order
// to avoid foreign key violations.

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { afterAll, beforeEach } from "vitest";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

export const testDb = new PrismaClient({ adapter });

// Clean tables in reverse dependency order before each test
beforeEach(async () => {
  await testDb.$executeRawUnsafe(`DELETE FROM "attachments"`);
  await testDb.$executeRawUnsafe(`DELETE FROM "task_source_links"`);
  await testDb.$executeRawUnsafe(`DELETE FROM "source_events"`);
  await testDb.$executeRawUnsafe(`DELETE FROM "nodal_tasks"`);
  await testDb.$executeRawUnsafe(`DELETE FROM "users"`);
});

// Disconnect after all tests complete
afterAll(async () => {
  await testDb.$disconnect();
});
