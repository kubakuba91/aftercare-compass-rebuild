ALTER TABLE "AftercareProfile" ADD COLUMN "importMatchKey" TEXT;

CREATE UNIQUE INDEX "AftercareProfile_importMatchKey_key" ON "AftercareProfile"("importMatchKey");

CREATE TABLE "ProviderImportBatch" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "sourceFileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'validated',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "newOrganizationCount" INTEGER NOT NULL DEFAULT 0,
    "newLocationCount" INTEGER NOT NULL DEFAULT 0,
    "matchedLocationCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedRowCount" INTEGER NOT NULL DEFAULT 0,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderImportRow" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB,
    "previewAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'validated',
    "errorReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organizationId" TEXT,
    "profileId" TEXT,
    "resultMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderImportRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderImportBatch_createdAt_idx" ON "ProviderImportBatch"("createdAt");
CREATE INDEX "ProviderImportBatch_actorUserId_createdAt_idx" ON "ProviderImportBatch"("actorUserId", "createdAt");
CREATE INDEX "ProviderImportBatch_status_createdAt_idx" ON "ProviderImportBatch"("status", "createdAt");
CREATE UNIQUE INDEX "ProviderImportRow_importBatchId_rowNumber_key" ON "ProviderImportRow"("importBatchId", "rowNumber");
CREATE INDEX "ProviderImportRow_importBatchId_status_idx" ON "ProviderImportRow"("importBatchId", "status");
CREATE INDEX "ProviderImportRow_profileId_idx" ON "ProviderImportRow"("profileId");

ALTER TABLE "ProviderImportBatch" ADD CONSTRAINT "ProviderImportBatch_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProviderImportRow" ADD CONSTRAINT "ProviderImportRow_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ProviderImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
