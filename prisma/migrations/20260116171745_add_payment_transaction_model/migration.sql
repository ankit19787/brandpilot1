-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "paymentId" TEXT,
    "plan" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "resultCode" TEXT,
    "resultDescription" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_checkoutId_key" ON "public"."PaymentTransaction"("checkoutId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "public"."PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "public"."PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_checkoutId_idx" ON "public"."PaymentTransaction"("checkoutId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "public"."PaymentTransaction"("createdAt");
