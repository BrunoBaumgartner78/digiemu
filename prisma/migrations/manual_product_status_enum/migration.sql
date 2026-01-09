-- ============================
-- 1) Normalize legacy values
-- ============================

-- empty/null -> DRAFT
UPDATE "Product"
SET "status" = 'DRAFT'
WHERE "status" IS NULL OR btrim("status") = '';

-- map legacy PUBLISHED -> ACTIVE
UPDATE "Product"
SET "status" = 'ACTIVE'
WHERE upper("status") = 'PUBLISHED';

-- normalize casing for known values
UPDATE "Product"
SET "status" = upper("status")
WHERE upper("status") IN ('DRAFT','ACTIVE','APPROVED','BLOCKED');

-- everything else -> DRAFT (safety)
UPDATE "Product"
SET "status" = 'DRAFT'
WHERE upper("status") NOT IN ('DRAFT','ACTIVE','APPROVED','BLOCKED');

-- ============================
-- 2) Create enum type
-- ============================
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT','ACTIVE','APPROVED','BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================
-- 3) Alter column to enum
-- ============================
ALTER TABLE "Product"
  ALTER COLUMN "status" TYPE "ProductStatus"
  USING (upper("status")::"ProductStatus");

-- default
ALTER TABLE "Product"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';
