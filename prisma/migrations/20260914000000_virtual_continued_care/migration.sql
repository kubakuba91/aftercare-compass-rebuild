ALTER TABLE "AftercareProfile" ADD COLUMN "statesServed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "insuranceNotes" TEXT, ADD COLUMN "programmingTimeZone" TEXT;
