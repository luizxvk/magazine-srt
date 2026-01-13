-- Add new columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "screenshots" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "developer" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "releaseDate" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeGB" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "platform" TEXT;

-- Create ProductTag table
CREATE TABLE IF NOT EXISTS "ProductTag" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on ProductTag
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductTag_productId_tag_key') THEN
        ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_tag_key" UNIQUE ("productId", "tag");
    END IF;
END $$;

-- Create index on tag
CREATE INDEX IF NOT EXISTS "ProductTag_tag_idx" ON "ProductTag"("tag");

-- Add foreign key from ProductTag to Product
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductTag_productId_fkey') THEN
        ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
