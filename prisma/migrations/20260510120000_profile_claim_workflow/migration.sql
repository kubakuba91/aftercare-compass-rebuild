CREATE TYPE "ProfileOwnershipStatus" AS ENUM ('claimed', 'unclaimed', 'claim_pending');

CREATE TYPE "ProfileClaimStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

ALTER TABLE "AftercareProfile"
ADD COLUMN "ownershipStatus" "ProfileOwnershipStatus" NOT NULL DEFAULT 'claimed',
ADD COLUMN "claimedAt" TIMESTAMP(3),
ADD COLUMN "claimedByUserId" TEXT,
ADD COLUMN "seededByUserId" TEXT;

CREATE TABLE "ProfileClaimRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "claimantUserId" TEXT,
    "claimantName" TEXT NOT NULL,
    "claimantEmail" TEXT NOT NULL,
    "claimantPhone" TEXT,
    "claimantRole" TEXT,
    "claimantOrganization" TEXT,
    "relationshipToProgram" TEXT,
    "notes" TEXT,
    "status" "ProfileClaimStatus" NOT NULL DEFAULT 'pending',
    "reviewedByUserId" TEXT,
    "reviewerNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileClaimRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AftercareProfile_ownershipStatus_idx" ON "AftercareProfile"("ownershipStatus");

CREATE INDEX "ProfileClaimRequest_profileId_status_idx" ON "ProfileClaimRequest"("profileId", "status");

CREATE INDEX "ProfileClaimRequest_claimantUserId_idx" ON "ProfileClaimRequest"("claimantUserId");

CREATE INDEX "ProfileClaimRequest_claimantEmail_idx" ON "ProfileClaimRequest"("claimantEmail");

CREATE INDEX "ProfileClaimRequest_status_submittedAt_idx" ON "ProfileClaimRequest"("status", "submittedAt");

CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

ALTER TABLE "ProfileClaimRequest" ADD CONSTRAINT "ProfileClaimRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileClaimRequest" ADD CONSTRAINT "ProfileClaimRequest_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProfileClaimRequest" ADD CONSTRAINT "ProfileClaimRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
