ALTER TABLE "ReferentOrganization"
ADD COLUMN "streetAddress" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "zip" TEXT,
ADD COLUMN "currentPlacementMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "invitedTeamEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
