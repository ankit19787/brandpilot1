-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatarStyle" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "email" TEXT;
