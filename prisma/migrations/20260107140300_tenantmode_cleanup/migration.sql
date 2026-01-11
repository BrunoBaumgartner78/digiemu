-- tenantmode_cleanup: rebuild enum safely (no ADD VALUE)

-- 0) drop default first (avoids "default cannot be cast automatically")
ALTER TABLE "Tenant" ALTER COLUMN "mode" DROP DEFAULT;

-- 1) rebuild enum
ALTER TYPE "TenantMode" RENAME TO "TenantMode_old";
CREATE TYPE "TenantMode" AS ENUM ('WHITE_LABEL', 'MARKETPLACE');

-- 2) change column type with mapping in one step
ALTER TABLE "Tenant"
ALTER COLUMN "mode" TYPE "TenantMode"
USING (
  CASE "mode"::text
    -- old values you might have had in different branches:
    WHEN 'MARKETPLACE' THEN 'MARKETPLACE'
    WHEN 'MULTI_VENDOR' THEN 'MARKETPLACE'
    WHEN 'MULTIVENDOR' THEN 'MARKETPLACE'
    WHEN 'SINGLE_VENDOR' THEN 'WHITE_LABEL'
    WHEN 'FREE_SHOP' THEN 'WHITE_LABEL'
    WHEN 'MIXED' THEN 'WHITE_LABEL'
    WHEN 'PAID_VENDOR' THEN 'WHITE_LABEL'
    -- fallback
    ELSE 'WHITE_LABEL'
  END
)::"TenantMode";

-- 3) drop old enum
DROP TYPE "TenantMode_old";

-- 4) re-add default
ALTER TABLE "Tenant" ALTER COLUMN "mode" SET DEFAULT 'MARKETPLACE';
