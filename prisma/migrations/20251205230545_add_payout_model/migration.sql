/*
  Warnings:

  - You are about to drop the column `paidAt` on the `Payout` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "paidAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
