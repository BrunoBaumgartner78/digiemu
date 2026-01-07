-- DropIndex
DROP INDEX "VendorProfile_tenantKey_slug_key";

-- DropIndex
DROP INDEX "VendorProfile_tenantKey_userId_key";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tenantKey" DROP NOT NULL,
ALTER COLUMN "tenantKey" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "tenantKey" DROP NOT NULL,
ALTER COLUMN "tenantKey" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorProfile" ALTER COLUMN "tenantKey" DROP NOT NULL,
ALTER COLUMN "tenantKey" DROP DEFAULT;
