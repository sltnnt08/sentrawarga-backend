-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "aiCategory" "Category",
ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiSpamFlag" BOOLEAN;
