CREATE TABLE "ProfileOption" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProfileOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileOption_category_label_key" ON "ProfileOption"("category", "label");
CREATE INDEX "ProfileOption_category_isActive_sortOrder_idx" ON "ProfileOption"("category", "isActive", "sortOrder");

INSERT INTO "ProfileOption" ("id", "category", "label", "sortOrder", "updatedAt") VALUES
  ('profile-option-certifications-held-001', 'certificationsHeld', 'NARR Level 1', 10, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-002', 'certificationsHeld', 'NARR Level 2', 20, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-003', 'certificationsHeld', 'NARR Level 3', 30, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-004', 'certificationsHeld', 'Sober Living Network (SLN)', 40, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-005', 'certificationsHeld', 'Minnesota Association of Sober Homes (MASH)', 50, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-006', 'certificationsHeld', 'The Joint Commission', 60, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-007', 'certificationsHeld', 'CARF', 70, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-008', 'certificationsHeld', 'Oxford House', 80, CURRENT_TIMESTAMP),
  ('profile-option-certifications-held-009', 'certificationsHeld', 'State-specific license', 90, CURRENT_TIMESTAMP),
  ('profile-option-support-services-001', 'supportServices', '12-Step Meetings', 10, CURRENT_TIMESTAMP),
  ('profile-option-support-services-002', 'supportServices', 'AA/NA on-site', 20, CURRENT_TIMESTAMP),
  ('profile-option-support-services-003', 'supportServices', 'Case Management', 30, CURRENT_TIMESTAMP),
  ('profile-option-support-services-004', 'supportServices', 'Clinician on staff', 40, CURRENT_TIMESTAMP),
  ('profile-option-support-services-005', 'supportServices', 'Legal Support', 50, CURRENT_TIMESTAMP),
  ('profile-option-support-services-006', 'supportServices', 'Life Skills Training', 60, CURRENT_TIMESTAMP),
  ('profile-option-support-services-007', 'supportServices', 'Vocational Support', 70, CURRENT_TIMESTAMP),
  ('profile-option-support-services-008', 'supportServices', 'Transportation Assistance', 80, CURRENT_TIMESTAMP),
  ('profile-option-support-services-009', 'supportServices', 'Peer Support Specialist', 90, CURRENT_TIMESTAMP),
  ('profile-option-support-services-010', 'supportServices', 'Mental Health Services', 100, CURRENT_TIMESTAMP),
  ('profile-option-support-services-011', 'supportServices', 'Trauma-Informed Care', 110, CURRENT_TIMESTAMP),
  ('profile-option-amenities-001', 'amenities', 'High-Speed WiFi', 10, CURRENT_TIMESTAMP),
  ('profile-option-amenities-002', 'amenities', 'Memory Foam Mattress', 20, CURRENT_TIMESTAMP),
  ('profile-option-amenities-003', 'amenities', 'Overnight Passes', 30, CURRENT_TIMESTAMP),
  ('profile-option-amenities-004', 'amenities', 'Pet Friendly', 40, CURRENT_TIMESTAMP),
  ('profile-option-amenities-005', 'amenities', 'Multiple Refrigerators', 50, CURRENT_TIMESTAMP),
  ('profile-option-amenities-006', 'amenities', 'Public Transportation Access', 60, CURRENT_TIMESTAMP),
  ('profile-option-amenities-007', 'amenities', 'In-unit Laundry', 70, CURRENT_TIMESTAMP),
  ('profile-option-amenities-008', 'amenities', 'Gym/Fitness Access', 80, CURRENT_TIMESTAMP),
  ('profile-option-amenities-009', 'amenities', 'Private Bathroom', 90, CURRENT_TIMESTAMP),
  ('profile-option-amenities-010', 'amenities', 'Outdoor Space', 100, CURRENT_TIMESTAMP),
  ('profile-option-amenities-011', 'amenities', 'TV in room', 110, CURRENT_TIMESTAMP),
  ('profile-option-amenities-012', 'amenities', 'Parking', 120, CURRENT_TIMESTAMP),
  ('profile-option-insurance-accepted-001', 'insuranceAccepted', 'Medicaid', 10, CURRENT_TIMESTAMP),
  ('profile-option-insurance-accepted-002', 'insuranceAccepted', 'Medicare', 20, CURRENT_TIMESTAMP),
  ('profile-option-insurance-accepted-003', 'insuranceAccepted', 'Commercial Insurance', 30, CURRENT_TIMESTAMP),
  ('profile-option-insurance-accepted-004', 'insuranceAccepted', 'Private Pay / Self-Pay', 40, CURRENT_TIMESTAMP),
  ('profile-option-insurance-accepted-005', 'insuranceAccepted', 'Sliding Scale', 50, CURRENT_TIMESTAMP)
ON CONFLICT ("category", "label") DO NOTHING;
