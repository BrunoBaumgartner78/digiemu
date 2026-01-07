/*
  Warnings:

  - A unique constraint covering the columns `[tenantKey,userId]` on the table `VendorProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantKey,slug]` on the table `VendorProfile` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tenantKey` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantKey` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantKey` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "DownloadLink" ALTER COLUMN "tenantKey" SET DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tenantKey" SET NOT NULL,
ALTER COLUMN "tenantKey" SET DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "tenantKey" SET DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "tenantKey" SET NOT NULL,
ALTER COLUMN "tenantKey" SET DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "VendorProfile" ALTER COLUMN "tenantKey" SET NOT NULL,
ALTER COLUMN "tenantKey" SET DEFAULT 'DEFAULT';

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" "TenantPlan" NOT NULL DEFAULT 'FREE',
    "logoUrl" TEXT,
    "themeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_key_key" ON "Tenant"("key");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_plan_idx" ON "Tenant"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_domain_key" ON "TenantDomain"("domain");

-- CreateIndex
CREATE INDEX "TenantDomain_tenantId_idx" ON "TenantDomain"("tenantId");

-- CreateIndex
CREATE INDEX "TenantDomain_isPrimary_idx" ON "TenantDomain"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_tenantKey_userId_key" ON "VendorProfile"("tenantKey", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_tenantKey_slug_key" ON "VendorProfile"("tenantKey", "slug");

-- AddForeignKey
ALTER TABLE "TenantDomain" ADD CONSTRAINT "TenantDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
