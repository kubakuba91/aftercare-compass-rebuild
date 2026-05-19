ALTER TABLE "AftercareProfile"
  ADD COLUMN "publicLatitude" DECIMAL(65,30),
  ADD COLUMN "publicLongitude" DECIMAL(65,30),
  ADD COLUMN "geocodedAt" TIMESTAMP(3);
