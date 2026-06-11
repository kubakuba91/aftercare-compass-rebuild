ALTER TABLE "AftercareProfile"
ADD COLUMN "medicationServicesOffered" TEXT[] DEFAULT ARRAY[]::TEXT[];
