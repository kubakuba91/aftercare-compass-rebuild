-- CreateEnum
CREATE TYPE "Role" AS ENUM ('system_admin', 'referent_admin', 'referent_manager', 'aftercare_admin', 'aftercare_manager');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('referent', 'aftercare_sober_living', 'aftercare_continued_care');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('sober_living', 'continued_care');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('draft', 'published', 'suspended', 'under_review');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'viewed', 'accepted', 'declined', 'waitlisted', 'placed', 'closed');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'closed', 'spam');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('open', 'under_review', 'resolved_action_taken', 'resolved_no_action');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL,
    "orgId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "subscriptionPlan" TEXT,
    "subscriptionStatus" "SubscriptionStatus",
    "subscriptionBillingCycle" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionRenewsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferentOrganization" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "orgTypeDetail" TEXT NOT NULL,
    "healthSystemAffiliation" TEXT,
    "medicalRecordsFax" TEXT,
    "npiNumber" TEXT,
    "stateLicenseNumber" TEXT,
    "ehrSystem" TEXT,
    "statesOperatedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "levelsOfCare" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avgMonthlyReferrals" TEXT,

    CONSTRAINT "ReferentOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AftercareProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "ProfileType" NOT NULL,
    "programName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'draft',
    "verificationTier" INTEGER NOT NULL DEFAULT 1,
    "streetAddress" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "publicCity" TEXT NOT NULL,
    "publicState" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "admissionsContactPhone" TEXT,
    "admissionsContactEmail" TEXT,
    "preferredContactMethod" TEXT,
    "populationServed" TEXT,
    "specialtyPopulations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalBeds" INTEGER,
    "bedsMen" INTEGER,
    "bedsWomen" INTEGER,
    "bedsLgbtq" INTEGER,
    "bedsAvailable" INTEGER,
    "bedsAvailableUpdatedAt" TIMESTAMP(3),
    "acceptingNewPatients" BOOLEAN,
    "acceptingNewPatientsUpdatedAt" TIMESTAMP(3),
    "nextAvailableDate" TIMESTAMP(3),
    "availabilityNotes" TEXT,
    "pricePerWeek" INTEGER,
    "fundingAvailable" BOOLEAN,
    "fundingNotes" TEXT,
    "insuranceAccepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "houseRulesUrl" TEXT,
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AftercareProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referentUserId" TEXT NOT NULL,
    "referentOrgId" TEXT NOT NULL,
    "aftercareOrgId" TEXT NOT NULL,
    "aftercareProfileId" TEXT NOT NULL,
    "caseManagerName" TEXT NOT NULL,
    "caseManagerEmail" TEXT NOT NULL,
    "caseManagerPhone" TEXT NOT NULL,
    "caseManagerOrganization" TEXT NOT NULL,
    "clientAgeRange" TEXT NOT NULL,
    "supportCategory" TEXT NOT NULL,
    "insuranceCategory" TEXT NOT NULL,
    "preferredStartWindow" TEXT NOT NULL,
    "specialNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasonForReferral" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waitlistPosition" INTEGER,
    "expectedAvailabilityDate" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "aftercareOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'public_profile_contact',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "handledByUserId" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reportedByUserId" TEXT,
    "flagType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FlagStatus" NOT NULL DEFAULT 'open',
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ReferentOrganization_orgId_key" ON "ReferentOrganization"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "AftercareProfile_slug_key" ON "AftercareProfile"("slug");

-- CreateIndex
CREATE INDEX "AftercareProfile_orgId_idx" ON "AftercareProfile"("orgId");

-- CreateIndex
CREATE INDEX "AftercareProfile_type_status_idx" ON "AftercareProfile"("type", "status");

-- CreateIndex
CREATE INDEX "AftercareProfile_publicCity_publicState_idx" ON "AftercareProfile"("publicCity", "publicState");

-- CreateIndex
CREATE INDEX "AftercareProfile_verificationTier_idx" ON "AftercareProfile"("verificationTier");

-- CreateIndex
CREATE INDEX "VerificationDocument_profileId_idx" ON "VerificationDocument"("profileId");

-- CreateIndex
CREATE INDEX "VerificationDocument_status_idx" ON "VerificationDocument"("status");

-- CreateIndex
CREATE INDEX "VerificationDocument_expiresAt_idx" ON "VerificationDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "Referral_referentOrgId_status_idx" ON "Referral"("referentOrgId", "status");

-- CreateIndex
CREATE INDEX "Referral_aftercareOrgId_status_idx" ON "Referral"("aftercareOrgId", "status");

-- CreateIndex
CREATE INDEX "Referral_aftercareProfileId_status_idx" ON "Referral"("aftercareProfileId", "status");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE INDEX "Message_referralId_createdAt_idx" ON "Message"("referralId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderUserId_idx" ON "Message"("senderUserId");

-- CreateIndex
CREATE INDEX "Lead_profileId_idx" ON "Lead"("profileId");

-- CreateIndex
CREATE INDEX "Lead_aftercareOrgId_status_idx" ON "Lead"("aftercareOrgId", "status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Flag_profileId_idx" ON "Flag"("profileId");

-- CreateIndex
CREATE INDEX "Flag_status_idx" ON "Flag"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferentOrganization" ADD CONSTRAINT "ReferentOrganization_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AftercareProfile" ADD CONSTRAINT "AftercareProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referentUserId_fkey" FOREIGN KEY ("referentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referentOrgId_fkey" FOREIGN KEY ("referentOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_aftercareOrgId_fkey" FOREIGN KEY ("aftercareOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_aftercareProfileId_fkey" FOREIGN KEY ("aftercareProfileId") REFERENCES "AftercareProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_aftercareOrgId_fkey" FOREIGN KEY ("aftercareOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
