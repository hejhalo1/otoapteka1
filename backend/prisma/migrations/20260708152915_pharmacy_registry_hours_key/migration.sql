-- DropIndex
DROP INDEX "pharmacy_location_gist";

-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "registryHoursKey" TEXT;
