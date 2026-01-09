-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'PENDING';
