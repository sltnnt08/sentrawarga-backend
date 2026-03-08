/*
  Warnings:

  - You are about to drop the `ReportImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReportImage" DROP CONSTRAINT "ReportImage_reportId_fkey";

-- DropTable
DROP TABLE "ReportImage";

-- CreateTable
CREATE TABLE "reportImages" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "reportImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reportImages" ADD CONSTRAINT "reportImages_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
