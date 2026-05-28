-- CreateTable
CREATE TABLE "favorite_providers" (
    "id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_providers_seeker_id_idx" ON "favorite_providers"("seeker_id");

-- CreateIndex
CREATE INDEX "favorite_providers_provider_id_idx" ON "favorite_providers"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_providers_seeker_id_provider_id_key" ON "favorite_providers"("seeker_id", "provider_id");

-- AddForeignKey
ALTER TABLE "favorite_providers" ADD CONSTRAINT "favorite_providers_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_providers" ADD CONSTRAINT "favorite_providers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
