-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('service_seeker', 'service_provider', 'admin');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'distributed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'audio');

-- CreateEnum
CREATE TYPE "AlarmLevel" AS ENUM ('none', 'info', 'yellow', 'red');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('none', 'open', 'resolved');

-- CreateEnum
CREATE TYPE "JobCompletionStatus" AS ENUM ('pending_provider', 'pending_seeker', 'completed', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('super_admin', 'team_leader', 'quality_staff', 'ops_staff', 'finance_staff', 'marketing_staff', 'sales_staff', 'hr_staff', 'executive', 'rnd_staff');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_masked" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL,
    "kvkk_consent" BOOLEAN NOT NULL DEFAULT false,
    "kvkk_consent_date" TIMESTAMP(3),
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_ids" UUID[],
    "description" TEXT,
    "avg_rating" DECIMAL(3,2),
    "total_jobs" INTEGER NOT NULL DEFAULT 0,
    "response_time_avg" INTEGER,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "subscription_id" UUID,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "form_data" JSONB NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accepted_offers" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seeker_consent" BOOLEAN NOT NULL DEFAULT false,
    "seeker_consent_at" TIMESTAMP(3),

    CONSTRAINT "accepted_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_reveal_logs" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "revealed_user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "revealed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_reveal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_sessions" (
    "id" UUID NOT NULL,
    "session_uuid" TEXT NOT NULL,
    "collected_data" JSONB,
    "chat_step" TEXT,
    "converted_to_user_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" "MessageType" NOT NULL DEFAULT 'text',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_completions" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "provider_declared_amount" DECIMAL(65,30),
    "provider_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "provider_confirmed_at" TIMESTAMP(3),
    "seeker_declared_amount" DECIMAL(65,30),
    "seeker_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "seeker_confirmed_at" TIMESTAMP(3),
    "amount_diff" DECIMAL(65,30),
    "amount_diff_pct" DECIMAL(65,30),
    "alarm_level" "AlarmLevel",
    "dispute_status" "DisputeStatus" NOT NULL DEFAULT 'none',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "status" "JobCompletionStatus" NOT NULL DEFAULT 'pending_provider',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "StaffRole" NOT NULL,
    "team_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_user_id_key" ON "service_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "service_requests_seeker_id_status_idx" ON "service_requests"("seeker_id", "status");

-- CreateIndex
CREATE INDEX "service_requests_status_created_at_idx" ON "service_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "service_requests_category_id_status_idx" ON "service_requests"("category_id", "status");

-- CreateIndex
CREATE INDEX "offers_provider_id_status_idx" ON "offers"("provider_id", "status");

-- CreateIndex
CREATE INDEX "offers_job_id_status_idx" ON "offers"("job_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "offers_job_id_provider_id_key" ON "offers"("job_id", "provider_id");

-- CreateIndex
CREATE INDEX "accepted_offers_job_id_idx" ON "accepted_offers"("job_id");

-- CreateIndex
CREATE INDEX "accepted_offers_provider_id_idx" ON "accepted_offers"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "temp_sessions_session_uuid_key" ON "temp_sessions"("session_uuid");

-- CreateIndex
CREATE INDEX "messages_job_id_created_at_idx" ON "messages"("job_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_receiver_id_is_read_idx" ON "messages"("receiver_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_role_idx" ON "staff"("role");

-- AddForeignKey
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_offers" ADD CONSTRAINT "accepted_offers_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_offers" ADD CONSTRAINT "accepted_offers_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_offers" ADD CONSTRAINT "accepted_offers_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accepted_offers" ADD CONSTRAINT "accepted_offers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_reveal_logs" ADD CONSTRAINT "phone_reveal_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_completions" ADD CONSTRAINT "job_completions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_completions" ADD CONSTRAINT "job_completions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_completions" ADD CONSTRAINT "job_completions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
