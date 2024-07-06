-- DropIndex
DROP INDEX "Schedule_trackId_key";

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "effectiveFrom" DATE NOT NULL DEFAULT '2000-01-01 00:00:00 +00:00',
ADD COLUMN     "effectiveTo" DATE;
