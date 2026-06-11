ALTER TABLE "AftercareProfile"
ADD COLUMN "programmingSchedule" TEXT[] DEFAULT ARRAY[]::TEXT[];
