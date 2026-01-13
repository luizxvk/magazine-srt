-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('DISCORD', 'STEAM', 'TWITCH');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "linkedProductId" TEXT;

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "platformId" TEXT NOT NULL,
    "platformUsername" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSynced" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "activityType" TEXT NOT NULL,
    "gameName" TEXT,
    "gameId" TEXT,
    "status" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "streamUrl" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialConnection_userId_idx" ON "SocialConnection"("userId");

-- CreateIndex
CREATE INDEX "SocialConnection_platform_idx" ON "SocialConnection"("platform");

-- CreateIndex
CREATE INDEX "SocialConnection_platformId_idx" ON "SocialConnection"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialConnection_userId_platform_key" ON "SocialConnection"("userId", "platform");

-- CreateIndex
CREATE INDEX "SocialActivity_userId_idx" ON "SocialActivity"("userId");

-- CreateIndex
CREATE INDEX "SocialActivity_platform_idx" ON "SocialActivity"("platform");

-- CreateIndex
CREATE INDEX "SocialActivity_activityType_idx" ON "SocialActivity"("activityType");

-- CreateIndex
CREATE INDEX "SocialActivity_isLive_idx" ON "SocialActivity"("isLive");

-- CreateIndex
CREATE INDEX "SocialActivity_startedAt_idx" ON "SocialActivity"("startedAt");

-- CreateIndex
CREATE INDEX "Post_linkedProductId_idx" ON "Post"("linkedProductId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_linkedProductId_fkey" FOREIGN KEY ("linkedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialActivity" ADD CONSTRAINT "SocialActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
