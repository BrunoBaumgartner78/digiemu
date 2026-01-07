-- 1) Rewrite any legacy values (defensive)
UPDATE "Tenant"
SET "mode" = 'WHITE_LABEL'
WHERE "mode" IN ('SINGLE_VENDOR','MULTI_VENDOR');

-- 2) Recreate enum with final values (Postgres)
--    (Drop/recreate pattern because removing enum values isn't supported directly)
ALTER TYPE "TenantMode" RENAME TO "TenantMode_old";

CREATE TYPE "TenantMode" AS ENUM ('WHITE_LABEL', 'MARKETPLACE');

ALTER TABLE "Tenant"
ALTER COLUMN "mode" TYPE "TenantMode"
USING "mode"::text::"TenantMode";

DROP TYPE "TenantMode_old";
