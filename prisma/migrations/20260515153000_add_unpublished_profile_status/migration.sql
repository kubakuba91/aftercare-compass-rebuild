ALTER TYPE "ProfileStatus" ADD VALUE IF NOT EXISTS 'unpublished';

ALTER TABLE "AftercareProfile" ADD COLUMN "unpublishedAt" TIMESTAMP(3);
ALTER TABLE "AftercareProfile" ADD COLUMN "unpublishedByUserId" TEXT;
