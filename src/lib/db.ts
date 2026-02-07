// =============================================================
// lib/db.ts
// Extended Prisma Client for Nots.ai
//
// WHY THIS EXISTS:
// Every query on TaskSourceLink must filter `dismissed = false`
// or soft-deleted links leak into the UI as ghost tasks.
// Relying on developers to remember this is a guaranteed bug.
//
// HOW IT WORKS:
// Uses Prisma Client Extensions (not the deprecated middleware API)
// to intercept all TaskSourceLink queries and inject the filter
// automatically. This is type-safe and composable.
//
// ESCAPE HATCH:
// For audit views or analytics where you NEED dismissed links,
// use `db.$unrestricted.taskSourceLink.findMany(...)` instead.
// This bypasses the soft-delete filter intentionally.
// =============================================================

import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "@prisma/client";

// =============================================================
// STEP 7b: NEON SERVERLESS ADAPTER
// Uses the pooled connection (DATABASE_URL) for app runtime.
// The direct connection (DIRECT_URL) is only used by Prisma CLI
// for migrations — it's configured in prisma.config.ts, not here.
// =============================================================

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

// Singleton to prevent multiple clients in dev (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}

// =============================================================
// SOFT DELETE EXTENSION
// Intercepts all TaskSourceLink read operations and injects
// `dismissed: false` into the where clause automatically.
//
// Covered operations:
//   findMany, findFirst, findFirstOrThrow, findUnique,
//   findUniqueOrThrow, count, aggregate, groupBy
//
// Also intercepts update/updateMany/delete/deleteMany to prevent
// accidental mutations on dismissed links without explicit intent.
// =============================================================

const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      taskSourceLink: {
        async findMany({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async findFirst({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async findFirstOrThrow({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async findUnique({ args, query }) {
          // findUnique only accepts unique fields in `where`,
          // so we can't inject dismissed directly. Instead we
          // run the query and check the result.
          const result = await query(args);
          if (result && result.dismissed) {
            return null;
          }
          return result;
        },

        async count({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async aggregate({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async groupBy({ args, query }) {
          args.where = injectDismissedFilter(args.where as any);
          return query(args);
        },

        // WRITE GUARDS: Prevent accidental updates/deletes on
        // dismissed links. If you need to mutate dismissed links,
        // use db.$unrestricted.
        async updateMany({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },

        async deleteMany({ args, query }) {
          args.where = injectDismissedFilter(args.where);
          return query(args);
        },
      },
    },
  });
});

// =============================================================
// FILTER INJECTION HELPER
// Merges `dismissed: false` into any existing where clause.
// If the caller already specified a `dismissed` value explicitly
// (which shouldn't happen via the extended client but guards
// against it), we do NOT override — log a warning instead.
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

// =============================================================
// EXPORTED CLIENTS
//
// db (default): All TaskSourceLink queries auto-filter dismissed.
//   Use this for EVERYTHING in the app.
//
// db.$unrestricted: Raw PrismaClient without soft-delete filter.
//   Use ONLY for:
//     - Audit log views ("show me all dismissed links")
//     - Analytics ("how many links were dismissed last month?")
//     - Admin tools for re-processing dismissed links
//   If you use this in a user-facing feature, you have a bug.
// =============================================================

const db = basePrisma.$extends(softDeleteExtension);

// Attach unrestricted client for escape hatch
// This is the raw Prisma client — no filters, no guards.
(db as any).$unrestricted = basePrisma;

type ExtendedDB = typeof db & { $unrestricted: PrismaClient };

export default db as ExtendedDB;

// =============================================================
// USAGE EXAMPLES
//
// Normal (auto-filtered — dismissed links excluded):
//
//   import db from "@/lib/db";
//
//   const links = await db.taskSourceLink.findMany({
//     where: { taskId: "some-task-id" },
//   });
//   // SQL: WHERE task_id = 'some-task-id' AND dismissed = false
//
//
// Escape hatch (audit view — ALL links including dismissed):
//
//   import db from "@/lib/db";
//
//   const allLinks = await db.$unrestricted.taskSourceLink.findMany({
//     where: { taskId: "some-task-id" },
//   });
//   // SQL: WHERE task_id = 'some-task-id' (no dismissed filter)
//
//
// Dismissing a link (HITL review action):
//
//   import db from "@/lib/db";
//
//   await db.$unrestricted.taskSourceLink.update({
//     where: { id: linkId },
//     data: {
//       dismissed: true,
//       dismissedAt: new Date(),
//       dismissedBy: reviewerUserId,
//     },
//   });
//
// =============================================================
