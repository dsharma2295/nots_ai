-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('SLACK', 'GMAIL', 'JIRA', 'TRELLO', 'ASANA', 'MANUAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "slack_token_enc" TEXT,
    "gmail_token_enc" TEXT,
    "jira_token_enc" TEXT,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodal_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "embedding" vector(768),
    "embedding_model" TEXT NOT NULL DEFAULT 'gemini-text-embedding-004',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodal_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_source_links" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "human_verified" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_source_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_events" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "raw_content" TEXT NOT NULL,
    "deep_link" TEXT NOT NULL,
    "sender" TEXT,
    "source_hash" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "nodal_tasks_user_id_idx" ON "nodal_tasks"("user_id");

-- CreateIndex
CREATE INDEX "nodal_tasks_status_idx" ON "nodal_tasks"("status");

-- CreateIndex
CREATE INDEX "nodal_tasks_priority_idx" ON "nodal_tasks"("priority");

-- CreateIndex
CREATE INDEX "nodal_tasks_needs_review_idx" ON "nodal_tasks"("needs_review");

-- CreateIndex
CREATE INDEX "task_source_links_task_id_idx" ON "task_source_links"("task_id");

-- CreateIndex
CREATE INDEX "task_source_links_event_id_idx" ON "task_source_links"("event_id");

-- CreateIndex
CREATE INDEX "task_source_links_relevance_score_idx" ON "task_source_links"("relevance_score");

-- CreateIndex
CREATE INDEX "task_source_links_dismissed_idx" ON "task_source_links"("dismissed");

-- CreateIndex
CREATE UNIQUE INDEX "task_source_links_task_id_event_id_key" ON "task_source_links"("task_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "source_events_source_hash_key" ON "source_events"("source_hash");

-- CreateIndex
CREATE INDEX "source_events_source_hash_idx" ON "source_events"("source_hash");

-- CreateIndex
CREATE INDEX "source_events_platform_idx" ON "source_events"("platform");

-- CreateIndex
CREATE INDEX "source_events_timestamp_idx" ON "source_events"("timestamp");

-- CreateIndex
CREATE INDEX "attachments_event_id_idx" ON "attachments"("event_id");

-- AddForeignKey
ALTER TABLE "nodal_tasks" ADD CONSTRAINT "nodal_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_source_links" ADD CONSTRAINT "task_source_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "nodal_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_source_links" ADD CONSTRAINT "task_source_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "source_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "source_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
