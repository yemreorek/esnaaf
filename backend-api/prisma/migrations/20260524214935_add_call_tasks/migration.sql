-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('normal', 'urgent');

-- CreateEnum
CREATE TYPE "CallTaskStatus" AS ENUM ('pending', 'in_progress', 'done', 'escalated');

-- CreateEnum
CREATE TYPE "CallTaskResult" AS ENUM ('satisfied', 'partial', 'unsatisfied', 'unreachable');

-- CreateTable
CREATE TABLE "call_tasks" (
    "id" UUID NOT NULL,
    "assigned_to" UUID,
    "job_completion_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'normal',
    "status" "CallTaskStatus" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "call_result" "CallTaskResult",
    "notes" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_tasks_pkey" PRIMARY KEY ("id")
);
