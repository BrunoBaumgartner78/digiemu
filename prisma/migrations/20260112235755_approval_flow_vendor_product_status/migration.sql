/*
  Warnings:

  - The `status` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `vendorProfileId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_vendorProfileId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "vendorProfileId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
