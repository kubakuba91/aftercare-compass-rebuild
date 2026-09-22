ALTER TABLE "Organization" ADD COLUMN "referentTrialStartedAt" TIMESTAMP(3), ADD COLUMN "referentTrialEndsAt" TIMESTAMP(3);
-- Existing no-card referent trials receive a fresh, explicit Professional trial.
UPDATE "Organization" SET "referentTrialStartedAt" = CURRENT_TIMESTAMP, "referentTrialEndsAt" = CURRENT_TIMESTAMP + INTERVAL '30 days', "subscriptionPlan" = 'professional'
WHERE "type" = 'referent' AND "subscriptionStatus" = 'trialing' AND "stripeSubscriptionId" IS NULL;
CREATE TABLE "ReferentTrialExtension" (
 "id" TEXT NOT NULL PRIMARY KEY, "orgId" TEXT NOT NULL, "actorUserId" TEXT NOT NULL,
 "previousEndsAt" TIMESTAMP(3) NOT NULL, "newEndsAt" TIMESTAMP(3) NOT NULL,
 "reason" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ReferentTrialExtension_orgId_createdAt_idx" ON "ReferentTrialExtension"("orgId", "createdAt");

-- Audit history is server-only; do not expose it through the Supabase Data API.
ALTER TABLE "ReferentTrialExtension" ENABLE ROW LEVEL SECURITY;
