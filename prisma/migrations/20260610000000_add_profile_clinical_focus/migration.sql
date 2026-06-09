ALTER TABLE "AftercareProfile"
ADD COLUMN "clinicalFocus" TEXT[] DEFAULT ARRAY[]::TEXT[];

INSERT INTO "ProfileOption" ("id", "category", "label", "sortOrder", "updatedAt") VALUES
  ('profile-option-clinical-focus-001', 'clinicalFocus', 'SUD', 10, CURRENT_TIMESTAMP),
  ('profile-option-clinical-focus-002', 'clinicalFocus', 'Mental Health', 20, CURRENT_TIMESTAMP),
  ('profile-option-clinical-focus-003', 'clinicalFocus', 'Co-occurring/Dual Diagnosis', 30, CURRENT_TIMESTAMP),
  ('profile-option-clinical-focus-004', 'clinicalFocus', 'Co-occurring Mental Health + SUD', 40, CURRENT_TIMESTAMP)
ON CONFLICT ("category", "label") DO NOTHING;
