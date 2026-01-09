-- 1) Rewrite any legacy values (defensive)
-- Use text comparison to avoid casting the literal to enum (shadow-db safe)
-- Map any non-final values to WHITE_LABEL (covers SINGLE_VENDOR, MULTI_VENDOR, etc.)
UPDATE "Tenant"
SET "mode" = 'WHITE_LABEL'
WHERE "mode"::text NOT IN ('WHITE_LABEL', 'MARKETPLACE');

-- 2) Recreate enum with final values (Postgres)
--    (Drop/recreate pattern because removing enum values isn't supported directly)
ALTER TYPE "TenantMode" RENAME TO "TenantMode_old";

CREATE TYPE "TenantMode" AS ENUM ('WHITE_LABEL', 'MARKETPLACE');

ALTER TABLE "Tenant"
ALTER COLUMN "mode" TYPE "TenantMode"
USING "mode"::text::"TenantMode";

DROP TYPE "TenantMode_old";
