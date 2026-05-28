-- CreateEnum
CREATE TYPE "NotifChannel" AS ENUM ('in_app', 'sms', 'email', 'push');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('sent', 'delivered', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "NpsGroup" AS ENUM ('promoter', 'passive', 'detractor');

-- CreateEnum
CREATE TYPE "NpsChannel" AS ENUM ('whatsapp', 'web');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fcm_token" TEXT;

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_code" VARCHAR(10) NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "status" "NotifStatus" NOT NULL DEFAULT 'pending',
    "message_id" TEXT,
    "payload" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "marketing_email" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_responses" (
    "id" UUID NOT NULL,
    "job_completion_id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "group" "NpsGroup" NOT NULL,
    "follow_up_text" TEXT,
    "channel" "NpsChannel" NOT NULL,
    "responded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_user_id_sent_at_idx" ON "notification_logs"("user_id", "sent_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "nps_responses_provider_id_created_at_idx" ON "nps_responses"("provider_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "nps_responses_seeker_id_created_at_idx" ON "nps_responses"("seeker_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_job_completion_id_fkey" FOREIGN KEY ("job_completion_id") REFERENCES "job_completions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
