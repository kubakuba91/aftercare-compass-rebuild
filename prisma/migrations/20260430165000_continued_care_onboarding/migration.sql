ALTER TABLE "AftercareProfile"
ADD COLUMN "programTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "telehealthAvailable" BOOLEAN,
ADD COLUMN "telehealthMode" TEXT,
ADD COLUMN "additionalLocations" TEXT,
ADD COLUMN "stateLicenseNumber" TEXT,
ADD COLUMN "levelsOfCare" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "hoursOfOperation" TEXT,
ADD COLUMN "matServicesOffered" BOOLEAN,
ADD COLUMN "coOccurringTreatment" BOOLEAN,
ADD COLUMN "intakeContactName" TEXT,
ADD COLUMN "referralProcessDescription" TEXT,
ADD COLUMN "affiliatedSoberLivingHomes" TEXT;
