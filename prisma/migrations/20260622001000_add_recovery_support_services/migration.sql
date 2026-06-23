ALTER TABLE "AftercareProfile"
ADD COLUMN "recoverySupportServices" TEXT[] DEFAULT ARRAY[]::TEXT[];
