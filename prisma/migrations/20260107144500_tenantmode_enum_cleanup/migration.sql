-- Manual migration placeholder: tenantmode_enum_cleanup
-- The `TenantMode` enum was recreated in production via
-- `scripts/tenantmode-enum-recreate.ts` to remove legacy variants.
-- No SQL necessary here because the change was applied out-of-band.

-- For audit: the following SQL was executed during maintenance:
-- ALTER TABLE "Tenant" ALTER COLUMN "mode" DROP DEFAULT;
-- ALTER TABLE "Tenant" ALTER COLUMN "mode" TYPE "TenantMode_new" USING ("mode"::text::"TenantMode_new");
-- DROP TYPE "TenantMode";
-- ALTER TYPE "TenantMode_new" RENAME TO "TenantMode";
-- ALTER TABLE "Tenant" ALTER COLUMN "mode" SET DEFAULT 'WHITE_LABEL';

-- If you need to re-run in another environment, use the `scripts/tenantmode-enum-recreate.ts` script.
