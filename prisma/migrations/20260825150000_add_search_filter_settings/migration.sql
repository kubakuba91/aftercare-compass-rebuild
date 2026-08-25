CREATE TABLE IF NOT EXISTS "SearchFilterSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "selectionMode" TEXT NOT NULL DEFAULT 'single',
    "showForSoberLiving" BOOLEAN NOT NULL DEFAULT true,
    "showForContinuedCare" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchFilterSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SearchFilterSetting_key_key" ON "SearchFilterSetting"("key");
CREATE INDEX IF NOT EXISTS "SearchFilterSetting_isActive_sortOrder_idx" ON "SearchFilterSetting"("isActive", "sortOrder");
