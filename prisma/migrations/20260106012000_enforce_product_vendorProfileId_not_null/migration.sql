/*
  Enforce Product.vendorProfileId NOT NULL
  - Backfill vendorProfileId for existing products by matching VendorProfile(userId=vendorId, tenantKey=tenantKey)
  - Fail migration if any Product rows still have NULL vendorProfileId
  - Then set NOT NULL + add index
*/

-- 1) Backfill vendorProfileId if missing
UPDATE "Product" p
SET "vendorProfileId" = vp."id"
FROM "VendorProfile" vp
WHERE p."vendorProfileId" IS NULL
  AND vp."userId" = p."vendorId"
  AND vp."tenantKey" = p."tenantKey";

-- 2) Abort if any rows still missing vendorProfileId
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Product" WHERE "vendorProfileId" IS NULL) THEN
    RAISE EXCEPTION 'Migration blocked: some Product rows have NULL vendorProfileId (cannot set NOT NULL).';
  END IF;
END $$;

-- 3) Enforce NOT NULL
ALTER TABLE "Product"
ALTER COLUMN "vendorProfileId" SET NOT NULL;

-- 4) Add helpful index
CREATE INDEX IF NOT EXISTS "Product_tenantKey_vendorProfileId_idx"
ON "Product"("tenantKey", "vendorProfileId");
