/*
  Warnings:

  - The values [RENDAH,TINGGI,KRITIS] on the enum `Priority` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `location` on the `Report` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
ALTER TABLE "Report" ALTER COLUMN "priority" TYPE "Priority_new" USING ("priority"::text::"Priority_new");
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
COMMIT;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "latitiude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
