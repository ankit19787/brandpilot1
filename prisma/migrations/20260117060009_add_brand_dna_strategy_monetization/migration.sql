-- CreateTable
CREATE TABLE "public"."BrandDNA" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "contentPillars" TEXT NOT NULL,
    "audienceType" TEXT NOT NULL,
    "writingStyle" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandDNA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyStrategy" TEXT NOT NULL,
    "platformFocus" TEXT NOT NULL,
    "suggestedHooks" TEXT NOT NULL,
    "recommendedMix" TEXT NOT NULL,
    "brandDNASnapshot" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MonetizationPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideas" TEXT NOT NULL,
    "dnaSnapshot" TEXT NOT NULL,
    "metricsSnapshot" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonetizationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandDNA_userId_idx" ON "public"."BrandDNA"("userId");

-- CreateIndex
CREATE INDEX "BrandDNA_isActive_idx" ON "public"."BrandDNA"("isActive");

-- CreateIndex
CREATE INDEX "ContentStrategy_userId_idx" ON "public"."ContentStrategy"("userId");

-- CreateIndex
CREATE INDEX "ContentStrategy_isActive_idx" ON "public"."ContentStrategy"("isActive");

-- CreateIndex
CREATE INDEX "MonetizationPlan_userId_idx" ON "public"."MonetizationPlan"("userId");

-- CreateIndex
CREATE INDEX "MonetizationPlan_isActive_idx" ON "public"."MonetizationPlan"("isActive");

-- AddForeignKey
ALTER TABLE "public"."BrandDNA" ADD CONSTRAINT "BrandDNA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentStrategy" ADD CONSTRAINT "ContentStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MonetizationPlan" ADD CONSTRAINT "MonetizationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
