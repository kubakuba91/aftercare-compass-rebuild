ALTER TABLE "AftercareProfile"
ADD COLUMN "bedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
