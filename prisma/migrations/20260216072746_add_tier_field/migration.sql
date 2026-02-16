-- AlterTable
ALTER TABLE "nodal_tasks" ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 3,
ALTER COLUMN "embedding_model" SET DEFAULT 'gemini-embedding-001';
