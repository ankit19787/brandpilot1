-- Add email and avatarStyle fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarStyle" TEXT NOT NULL DEFAULT 'default';
