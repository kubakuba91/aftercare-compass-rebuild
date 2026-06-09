ALTER TABLE "AftercareProfile"
ADD COLUMN "accreditations" TEXT[] DEFAULT ARRAY[]::TEXT[];

INSERT INTO "ProfileOption" ("id", "category", "label", "sortOrder", "updatedAt") VALUES
  ('profile-option-accreditations-001', 'accreditations', 'CARF', 10, CURRENT_TIMESTAMP),
  ('profile-option-accreditations-002', 'accreditations', 'The Joint Commission', 20, CURRENT_TIMESTAMP),
  ('profile-option-accreditations-003', 'accreditations', 'LegitScript', 30, CURRENT_TIMESTAMP),
  ('profile-option-accreditations-004', 'accreditations', 'NAATP', 40, CURRENT_TIMESTAMP),
  ('profile-option-accreditations-005', 'accreditations', 'ASAM Level of Care Certification', 50, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-001', 'levelsOfCare', 'Detox/ Medical Withdrawal Management', 10, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-002', 'levelsOfCare', 'Inpatient Psychiatric Unit', 20, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-003', 'levelsOfCare', 'Emergency Department', 30, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-004', 'levelsOfCare', 'Residential (RTC)', 40, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-005', 'levelsOfCare', 'Partial Hospitalization (PHP)', 50, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-006', 'levelsOfCare', 'Intensive Outpatient (IOP)', 60, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-007', 'levelsOfCare', 'Outpatient', 70, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-008', 'levelsOfCare', 'Crisis Stabilization', 80, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-009', 'levelsOfCare', 'Community Outreach', 90, CURRENT_TIMESTAMP),
  ('profile-option-levels-of-care-010', 'levelsOfCare', 'Other', 100, CURRENT_TIMESTAMP)
ON CONFLICT ("category", "label") DO NOTHING;
