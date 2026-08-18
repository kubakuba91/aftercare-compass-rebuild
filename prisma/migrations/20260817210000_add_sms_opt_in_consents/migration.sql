CREATE TABLE "SmsOptInConsent" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "consentText" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsOptInConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmsOptInConsent_phone_key" ON "SmsOptInConsent"("phone");
CREATE INDEX "SmsOptInConsent_userId_idx" ON "SmsOptInConsent"("userId");
CREATE INDEX "SmsOptInConsent_consentedAt_idx" ON "SmsOptInConsent"("consentedAt");

ALTER TABLE "SmsOptInConsent" ADD CONSTRAINT "SmsOptInConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SmsOptInConsent" ENABLE ROW LEVEL SECURITY;
