-- CreateTable
CREATE TABLE "StripeWebhookError" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "type" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StripeWebhookError_eventId_idx" ON "StripeWebhookError"("eventId");

-- CreateIndex
CREATE INDEX "StripeWebhookError_type_idx" ON "StripeWebhookError"("type");

-- CreateIndex
CREATE INDEX "StripeWebhookError_createdAt_idx" ON "StripeWebhookError"("createdAt");
