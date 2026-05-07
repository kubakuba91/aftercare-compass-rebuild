-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT,
ADD COLUMN "smsOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AvailabilitySmsCheck" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "outboundBody" TEXT NOT NULL,
    "inboundBody" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySmsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySmsCheck_token_key" ON "AvailabilitySmsCheck"("token");

-- CreateIndex
CREATE INDEX "AvailabilitySmsCheck_phone_status_createdAt_idx" ON "AvailabilitySmsCheck"("phone", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AvailabilitySmsCheck_profileId_status_idx" ON "AvailabilitySmsCheck"("profileId", "status");

-- CreateIndex
CREATE INDEX "AvailabilitySmsCheck_orgId_status_idx" ON "AvailabilitySmsCheck"("orgId", "status");

-- AddForeignKey
ALTER TABLE "AvailabilitySmsCheck" ADD CONSTRAINT "AvailabilitySmsCheck_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySmsCheck" ADD CONSTRAINT "AvailabilitySmsCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
