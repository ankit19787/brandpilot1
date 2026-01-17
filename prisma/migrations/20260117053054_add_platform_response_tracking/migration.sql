-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "lastPublishAttempt" TIMESTAMP(3),
ADD COLUMN     "platformError" TEXT,
ADD COLUMN     "platformPostId" TEXT,
ADD COLUMN     "platformResponse" TEXT,
ADD COLUMN     "publishAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Post_platformPostId_idx" ON "public"."Post"("platformPostId");
