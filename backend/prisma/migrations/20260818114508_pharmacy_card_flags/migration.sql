-- AlterTable
ALTER TABLE "PharmacyProfile" ADD COLUMN     "flagAnnouncement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flagSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flagVaccination" BOOLEAN NOT NULL DEFAULT false;
