/*
  Warnings:

  - Made the column `expiresAt` on table `DownloadLink` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DownloadLink" DROP CONSTRAINT "DownloadLink_orderId_fkey";

-- AlterTable
ALTER TABLE "DownloadLink" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDownloads" INTEGER NOT NULL DEFAULT 3,
ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "DownloadLink_orderId_idx" ON "DownloadLink"("orderId");

-- CreateIndex
CREATE INDEX "DownloadLink_expiresAt_idx" ON "DownloadLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "DownloadLink" ADD CONSTRAINT "DownloadLink_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
