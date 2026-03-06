/*
  Warnings:

  - The values [LOW,HIGH,CRITICAL] on the enum `Priority` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isResolved` on the `Report` table. All the data in the column will be lost.
  - The `category` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `status` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('KRIMINAL', 'SAMPAH', 'BANJIR', 'POLUSI', 'JALANAN', 'MENGGANGGU', 'KECELAKAAN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DITUNDA', 'TERVERIFIKASI', 'DALAM_PROSES', 'TERSELESAIKAN', 'DITOLAK');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');

-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('RENDAH', 'NORMAL', 'TINGGI', 'KRITIS');
ALTER TABLE "Report" ALTER COLUMN "priority" TYPE "Priority_new" USING ("priority"::text::"Priority_new");
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
COMMIT;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "isResolved",
ADD COLUMN     "status" "ReportStatus" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "Category"[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "ReportImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "ReportImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportImage" ADD CONSTRAINT "ReportImage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
