/*
  Warnings:

  - The values [SINGLE_VENDOR,MULTI_VENDOR,MARKETPLACE] on the enum `TenantMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TenantMode_new" AS ENUM ('FREE_SHOP', 'MIXED', 'PAID_VENDOR', 'MULTIVENDOR');
ALTER TABLE "public"."Tenant" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "mode" TYPE "TenantMode_new" USING ("mode"::text::"TenantMode_new");
ALTER TYPE "TenantMode" RENAME TO "TenantMode_old";
ALTER TYPE "TenantMode_new" RENAME TO "TenantMode";
DROP TYPE "public"."TenantMode_old";
ALTER TABLE "Tenant" ALTER COLUMN "mode" SET DEFAULT 'MULTIVENDOR';
COMMIT;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "mode" SET DEFAULT 'MULTIVENDOR';
