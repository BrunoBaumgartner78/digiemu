/*
  Warnings:

  - You are about to drop the column `viewerId` on the `ProductView` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,userId,day]` on the table `ProductView` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,fingerprint,day]` on the table `ProductView` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `day` to the `ProductView` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_viewerId_fkey";

-- DropIndex
DROP INDEX "ProductView_createdAt_idx";

-- DropIndex
DROP INDEX "ProductView_viewerId_idx";

-- AlterTable
ALTER TABLE "ProductView" DROP COLUMN "viewerId",
ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductView_productId_userId_day_key" ON "ProductView"("productId", "userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ProductView_productId_fingerprint_day_key" ON "ProductView"("productId", "fingerprint", "day");

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
