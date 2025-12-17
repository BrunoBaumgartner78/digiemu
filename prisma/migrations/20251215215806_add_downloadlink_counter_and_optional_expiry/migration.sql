-- AlterTable
ALTER TABLE "DownloadLink" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "expiresAt" DROP NOT NULL;
