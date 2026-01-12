-- CreateEnum
CREATE TYPE "ThemePackRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "ThemePack" ADD COLUMN     "fontFamily" TEXT,
ADD COLUMN     "rarity" "ThemePackRarity" NOT NULL DEFAULT 'COMMON';

-- CreateIndex
CREATE INDEX "ThemePack_rarity_idx" ON "ThemePack"("rarity");
