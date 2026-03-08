/*
  Warnings:

  - You are about to drop the `reportImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reportImages" DROP CONSTRAINT "reportImages_reportId_fkey";

-- DropTable
DROP TABLE "reportImages";

-- CreateTable
CREATE TABLE "ReportImages" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "ReportImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportImages" ADD CONSTRAINT "ReportImages_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
