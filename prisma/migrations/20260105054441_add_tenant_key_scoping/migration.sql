/*
  Warnings:

  - A unique constraint covering the columns `[tenantKey,userId]` on the table `VendorProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantKey,slug]` on the table `VendorProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VendorProfile_slug_key";

-- DropIndex
DROP INDEX "VendorProfile_userId_key";

-- AlterTable
ALTER TABLE "DownloadLink" ADD COLUMN     "tenantKey" TEXT NOT NULL DEFAULT 'digiemu';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tenantKey" TEXT NOT NULL DEFAULT 'digiemu';

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "tenantKey" TEXT NOT NULL DEFAULT 'digiemu';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tenantKey" TEXT NOT NULL DEFAULT 'digiemu';

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "tenantKey" TEXT NOT NULL DEFAULT 'digiemu';

-- CreateIndex
CREATE INDEX "DownloadLink_tenantKey_idx" ON "DownloadLink"("tenantKey");

-- CreateIndex
CREATE INDEX "Order_tenantKey_idx" ON "Order"("tenantKey");

-- CreateIndex
CREATE INDEX "Order_tenantKey_buyerId_idx" ON "Order"("tenantKey", "buyerId");

-- CreateIndex
CREATE INDEX "Payout_tenantKey_idx" ON "Payout"("tenantKey");

-- CreateIndex
CREATE INDEX "Payout_tenantKey_vendorId_idx" ON "Payout"("tenantKey", "vendorId");

-- CreateIndex
CREATE INDEX "Product_tenantKey_idx" ON "Product"("tenantKey");

-- CreateIndex
CREATE INDEX "Product_tenantKey_vendorId_idx" ON "Product"("tenantKey", "vendorId");

-- CreateIndex
CREATE INDEX "Product_tenantKey_status_idx" ON "Product"("tenantKey", "status");

-- CreateIndex
CREATE INDEX "VendorProfile_tenantKey_idx" ON "VendorProfile"("tenantKey");

-- CreateIndex
CREATE INDEX "VendorProfile_tenantKey_status_idx" ON "VendorProfile"("tenantKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_tenantKey_userId_key" ON "VendorProfile"("tenantKey", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_tenantKey_slug_key" ON "VendorProfile"("tenantKey", "slug");
