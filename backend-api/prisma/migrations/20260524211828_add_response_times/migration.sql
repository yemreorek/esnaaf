-- CreateTable
CREATE TABLE "response_times" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "notified_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "response_duration_minutes" INTEGER,

    CONSTRAINT "response_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "response_times_provider_id_notified_at_idx" ON "response_times"("provider_id", "notified_at" DESC);
