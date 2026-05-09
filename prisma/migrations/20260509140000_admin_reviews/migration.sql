CREATE TYPE "AdminReviewSubjectType" AS ENUM ('referent_org', 'aftercare_profile');

CREATE TYPE "AdminReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "AdminReview" (
    "id" TEXT NOT NULL,
    "subjectType" "AdminReviewSubjectType" NOT NULL,
    "status" "AdminReviewStatus" NOT NULL DEFAULT 'pending',
    "orgId" TEXT NOT NULL,
    "profileId" TEXT,
    "submittedByEmail" TEXT,
    "reviewerNotes" TEXT,
    "reviewedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminReview_status_submittedAt_idx" ON "AdminReview"("status", "submittedAt");

CREATE INDEX "AdminReview_subjectType_status_idx" ON "AdminReview"("subjectType", "status");

CREATE INDEX "AdminReview_orgId_idx" ON "AdminReview"("orgId");

CREATE INDEX "AdminReview_profileId_idx" ON "AdminReview"("profileId");

ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminReview" ADD CONSTRAINT "AdminReview_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
