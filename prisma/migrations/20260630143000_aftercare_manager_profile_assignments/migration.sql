CREATE TYPE "AftercareManagerScope" AS ENUM ('all_profiles', 'assigned_profiles');

ALTER TABLE "User"
ADD COLUMN "aftercareManagerScope" "AftercareManagerScope" NOT NULL DEFAULT 'all_profiles';

ALTER TABLE "OrganizationInvite"
ADD COLUMN "aftercareManagerScope" "AftercareManagerScope" NOT NULL DEFAULT 'all_profiles';

CREATE TABLE "AftercareProfileManagerAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AftercareProfileManagerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationInviteProfileAssignment" (
  "id" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrganizationInviteProfileAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AftercareProfileManagerAssignment_userId_profileId_key"
ON "AftercareProfileManagerAssignment"("userId", "profileId");

CREATE INDEX "AftercareProfileManagerAssignment_profileId_idx"
ON "AftercareProfileManagerAssignment"("profileId");

CREATE UNIQUE INDEX "OrganizationInviteProfileAssignment_inviteId_profileId_key"
ON "OrganizationInviteProfileAssignment"("inviteId", "profileId");

CREATE INDEX "OrganizationInviteProfileAssignment_profileId_idx"
ON "OrganizationInviteProfileAssignment"("profileId");

ALTER TABLE "AftercareProfileManagerAssignment"
ADD CONSTRAINT "AftercareProfileManagerAssignment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AftercareProfileManagerAssignment"
ADD CONSTRAINT "AftercareProfileManagerAssignment_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationInviteProfileAssignment"
ADD CONSTRAINT "OrganizationInviteProfileAssignment_inviteId_fkey"
FOREIGN KEY ("inviteId") REFERENCES "OrganizationInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationInviteProfileAssignment"
ADD CONSTRAINT "OrganizationInviteProfileAssignment_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
