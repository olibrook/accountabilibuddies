-- CreateEnum
CREATE TYPE "TrackVisibility" AS ENUM ('Private', 'Public');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "visibility" "TrackVisibility" NOT NULL DEFAULT 'Public';
