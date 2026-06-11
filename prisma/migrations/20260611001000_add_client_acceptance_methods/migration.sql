ALTER TABLE "AftercareProfile"
ADD COLUMN "clientAcceptanceMethods" TEXT[] DEFAULT ARRAY[]::TEXT[];
