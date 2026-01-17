-- CreateIndex
CREATE INDEX "Post_platform_idx" ON "public"."Post"("platform");

-- CreateIndex
CREATE INDEX "Post_scheduledFor_idx" ON "public"."Post"("scheduledFor");

-- CreateIndex
CREATE INDEX "Post_userId_status_scheduledFor_idx" ON "public"."Post"("userId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "Post_userId_platform_idx" ON "public"."Post"("userId", "platform");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_plan_idx" ON "public"."User"("plan");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");
