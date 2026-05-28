-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('basic', 'standard', 'premium', 'vip');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'admin_trial', 'active', 'cancelled', 'suspended', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('percent', 'fixed', 'free_trial', 'upgrade');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "package_type" "PackageType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "iyzico_subscription_ref" TEXT,
    "admin_granted_by" UUID,
    "admin_trial_note" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "iyzico_payment_id" TEXT,
    "attempt_count" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" "CampaignType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "upgrade_to" "PackageType",
    "applicable_packages" TEXT[],
    "new_users_only" BOOLEAN NOT NULL DEFAULT false,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_usage" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_staff" UUID,

    CONSTRAINT "campaign_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_monthly_quota" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "month_year" VARCHAR(7) NOT NULL,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "monthly_limit" INTEGER,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_monthly_quota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_id_key" ON "subscriptions"("provider_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_expires_at_idx" ON "subscriptions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "payments_subscription_id_created_at_idx" ON "payments"("subscription_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_code_key" ON "campaigns"("code");

-- CreateIndex
CREATE INDEX "campaign_usage_provider_id_idx" ON "campaign_usage"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_monthly_quota_provider_id_month_year_key" ON "provider_monthly_quota"("provider_id", "month_year");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_usage" ADD CONSTRAINT "campaign_usage_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_usage" ADD CONSTRAINT "campaign_usage_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_usage" ADD CONSTRAINT "campaign_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_monthly_quota" ADD CONSTRAINT "provider_monthly_quota_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
