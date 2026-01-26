-- AlterTable: Make Badge.name unique
-- This migration adds a unique constraint to the Badge.name column
-- IMPORTANT: Before applying, run the clean_badges.ts script to remove duplicates

-- First, remove any duplicate badges (keeping the first one)
-- This is handled by the seed.ts or clean_badges.ts script

-- Then add the unique constraint
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_name_key" UNIQUE ("name");
