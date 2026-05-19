CREATE TABLE "ProfileAssociation" (
  "id" TEXT NOT NULL,
  "soberLivingProfileId" TEXT NOT NULL,
  "continuedCareProfileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProfileAssociation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileAssociation_soberLivingProfileId_continuedCareProfileId_key"
  ON "ProfileAssociation"("soberLivingProfileId", "continuedCareProfileId");

CREATE INDEX "ProfileAssociation_continuedCareProfileId_idx"
  ON "ProfileAssociation"("continuedCareProfileId");

ALTER TABLE "ProfileAssociation"
  ADD CONSTRAINT "ProfileAssociation_soberLivingProfileId_fkey"
  FOREIGN KEY ("soberLivingProfileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileAssociation"
  ADD CONSTRAINT "ProfileAssociation_continuedCareProfileId_fkey"
  FOREIGN KEY ("continuedCareProfileId") REFERENCES "AftercareProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
