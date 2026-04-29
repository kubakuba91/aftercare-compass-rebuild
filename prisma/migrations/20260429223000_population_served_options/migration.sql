ALTER TABLE "AftercareProfile"
ADD COLUMN "populationServedOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
