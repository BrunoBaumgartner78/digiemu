-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_vendorProfileId_fkey";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
