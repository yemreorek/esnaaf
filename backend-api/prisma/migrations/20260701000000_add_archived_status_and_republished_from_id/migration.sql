-- AlterEnum
ALTER TYPE "OfferStatus" ADD VALUE 'archived';

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN "republished_from_id" UUID;
