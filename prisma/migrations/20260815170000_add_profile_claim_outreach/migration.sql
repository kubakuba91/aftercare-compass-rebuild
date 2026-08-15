ALTER TABLE "AftercareProfile" ADD COLUMN "lastClaimOutreachAt" TIMESTAMP(3);

CREATE TABLE "ProfileClaimOutreach" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sentByUserId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "claimStartedAt" TIMESTAMP(3),
    "claimCompletedAt" TIMESTAMP(3),
    "claimRequestId" TEXT,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfileClaimOutreach_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'unsubscribe',
    "sourceOutreachId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileClaimOutreach_tokenHash_key" ON "ProfileClaimOutreach"("tokenHash");
CREATE UNIQUE INDEX "ProfileClaimOutreach_providerMessageId_key" ON "ProfileClaimOutreach"("providerMessageId");
CREATE INDEX "ProfileClaimOutreach_profileId_createdAt_idx" ON "ProfileClaimOutreach"("profileId", "createdAt");
CREATE INDEX "ProfileClaimOutreach_recipientEmail_createdAt_idx" ON "ProfileClaimOutreach"("recipientEmail", "createdAt");
CREATE INDEX "ProfileClaimOutreach_status_createdAt_idx" ON "ProfileClaimOutreach"("status", "createdAt");
CREATE UNIQUE INDEX "EmailSuppression_email_key" ON "EmailSuppression"("email");
CREATE INDEX "EmailSuppression_createdAt_idx" ON "EmailSuppression"("createdAt");

ALTER TABLE "ProfileClaimOutreach" ADD CONSTRAINT "ProfileClaimOutreach_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileClaimOutreach" ADD CONSTRAINT "ProfileClaimOutreach_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProfileClaimOutreach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailSuppression" ENABLE ROW LEVEL SECURITY;
