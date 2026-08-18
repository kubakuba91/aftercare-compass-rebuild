ALTER TABLE "ProfileImage"
ALTER COLUMN "presentationMode" SET DEFAULT 'photo';

UPDATE "ProfileImage"
SET "presentationMode" = 'photo'
WHERE "presentationMode" = 'auto';
