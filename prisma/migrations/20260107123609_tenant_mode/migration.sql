/*
  Fix: Map legacy values to the new enum during the cast.
  Old values seen in DB: MARKETPLACE, WHITE_LABEL, SINGLE_VENDOR, MULTI_VENDOR, etc.
  New enum: FREE_SHOP, MIXED, PAID_VENDOR, MULTIVENDOR
*/

BEGIN;

CREATE TYPE "TenantMode_new" AS ENUM ('FREE_SHOP', 'MIXED', 'PAID_VENDOR', 'MULTIVENDOR');

-- Drop default first (prevents "default cannot be cast automatically")
ALTER TABLE "public"."Tenant" ALTER COLUMN "mode" DROP DEFAULT;

-- Cast with mapping (this is the important part)
ALTER TABLE "public"."Tenant"
ALTER COLUMN "mode" TYPE "TenantMode_new"
USING (
  CASE "mode"::text
    WHEN 'WHITE_LABEL'    THEN 'FREE_SHOP'
    WHEN 'FREE_SHOP'      THEN 'FREE_SHOP'
    WHEN 'SINGLE_VENDOR'  THEN 'PAID_VENDOR'
    WHEN 'PAID_VENDOR'    THEN 'PAID_VENDOR'
    WHEN 'MULTI_VENDOR'   THEN 'MULTIVENDOR'
    WHEN 'MULTIVENDOR'    THEN 'MULTIVENDOR'
    WHEN 'MARKETPLACE'    THEN 'MULTIVENDOR'
    WHEN 'MIXED'          THEN 'MIXED'
    ELSE 'FREE_SHOP'
  END
)::"TenantMode_new";

-- Swap types
ALTER TYPE "public"."TenantMode" RENAME TO "TenantMode_old";
ALTER TYPE "public"."TenantMode_new" RENAME TO "TenantMode";
DROP TYPE "public"."TenantMode_old";

-- Re-add default (pick what you want as platform default)
ALTER TABLE "public"."Tenant" ALTER COLUMN "mode" SET DEFAULT 'MULTIVENDOR';

COMMIT;
