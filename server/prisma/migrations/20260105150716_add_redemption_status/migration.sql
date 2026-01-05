-- AlterTable
ALTER TABLE "Redemption" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
