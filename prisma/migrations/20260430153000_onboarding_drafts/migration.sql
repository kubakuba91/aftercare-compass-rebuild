CREATE TABLE "OnboardingDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedAccountType" TEXT,
    "activeStep" INTEGER NOT NULL DEFAULT 1,
    "referentDraft" JSONB,
    "soberLivingDraft" JSONB,
    "continuedCareDraft" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingDraft_userId_key" ON "OnboardingDraft"("userId");

ALTER TABLE "OnboardingDraft" ADD CONSTRAINT "OnboardingDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
