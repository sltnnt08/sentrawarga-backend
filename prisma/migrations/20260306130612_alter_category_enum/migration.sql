/*
  Warnings:

  - The values [KRIMINAL,SAMPAH,BANJIR,POLUSI,JALANAN,MENGGANGGU,KECELAKAAN] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - The values [DITUNDA,TERVERIFIKASI,DALAM_PROSES,TERSELESAIKAN,DITOLAK] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('CRIMINAL', 'TRASH', 'FLOOD', 'POLLUTION', 'ROADS_ISSUE', 'PUBLIC_DISTURBANCE', 'ACCIDENTS');
ALTER TABLE "Report" ALTER COLUMN "category" TYPE "Category_new"[] USING ("category"::text::"Category_new"[]);
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('PENDING', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
ALTER TABLE "Report" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "public"."ReportStatus_old";
COMMIT;
