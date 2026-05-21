CREATE TABLE "PhoneScreeningWindow" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "endMinute" INTEGER NOT NULL,
  "slotMinutes" INTEGER NOT NULL DEFAULT 30,
  "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PhoneScreeningWindow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhoneScreeningAppointment" (
  "id" TEXT NOT NULL,
  "referralId" TEXT NOT NULL,
  "aftercareProfileId" TEXT NOT NULL,
  "aftercareOrgId" TEXT NOT NULL,
  "bookedByUserId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PhoneScreeningAppointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PhoneScreeningWindow_profileId_isActive_idx" ON "PhoneScreeningWindow"("profileId", "isActive");
CREATE INDEX "PhoneScreeningWindow_dayOfWeek_idx" ON "PhoneScreeningWindow"("dayOfWeek");
CREATE UNIQUE INDEX "PhoneScreeningAppointment_referralId_status_key" ON "PhoneScreeningAppointment"("referralId", "status");
CREATE INDEX "PhoneScreeningAppointment_aftercareProfileId_startsAt_idx" ON "PhoneScreeningAppointment"("aftercareProfileId", "startsAt");
CREATE INDEX "PhoneScreeningAppointment_aftercareOrgId_startsAt_idx" ON "PhoneScreeningAppointment"("aftercareOrgId", "startsAt");
CREATE INDEX "PhoneScreeningAppointment_bookedByUserId_startsAt_idx" ON "PhoneScreeningAppointment"("bookedByUserId", "startsAt");
CREATE INDEX "PhoneScreeningAppointment_status_startsAt_idx" ON "PhoneScreeningAppointment"("status", "startsAt");

ALTER TABLE "PhoneScreeningWindow" ADD CONSTRAINT "PhoneScreeningWindow_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhoneScreeningAppointment" ADD CONSTRAINT "PhoneScreeningAppointment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhoneScreeningAppointment" ADD CONSTRAINT "PhoneScreeningAppointment_aftercareProfileId_fkey" FOREIGN KEY ("aftercareProfileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhoneScreeningAppointment" ADD CONSTRAINT "PhoneScreeningAppointment_aftercareOrgId_fkey" FOREIGN KEY ("aftercareOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhoneScreeningAppointment" ADD CONSTRAINT "PhoneScreeningAppointment_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
