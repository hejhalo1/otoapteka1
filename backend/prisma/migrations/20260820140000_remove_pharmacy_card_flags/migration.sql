-- Usunięcie funkcji kafelków-flag na karcie apteki (Nowa przecena / Ogłoszenie / Szczepienia).
ALTER TABLE "PharmacyProfile"
  DROP COLUMN "flagSale",
  DROP COLUMN "flagAnnouncement",
  DROP COLUMN "flagVaccination";
