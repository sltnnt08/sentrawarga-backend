/*
  Warnings:

  - You are about to drop the column `latitiude` on the `Report` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "latitiude",
ADD COLUMN     "latitude" DOUBLE PRECISION;
