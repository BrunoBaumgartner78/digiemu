-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_vendorProfileId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "vendorProfileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
