-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "platformEarningsCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vendorEarningsCents" INTEGER NOT NULL DEFAULT 0;
