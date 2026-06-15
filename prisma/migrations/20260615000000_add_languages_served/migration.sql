ALTER TABLE "AftercareProfile"
ADD COLUMN "languagesServed" TEXT[] DEFAULT ARRAY[]::TEXT[];
