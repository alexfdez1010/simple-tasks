-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "claimToken" TEXT,
    "responseCode" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookDelivery_state_nextAttemptAt_lockedUntil_idx" ON "WebhookDelivery"("state", "nextAttemptAt", "lockedUntil");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt" DESC);


-- Enforce the single configured destination and bounded delivery states.
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_singleton" CHECK ("id" = 'default');
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_state" CHECK ("state" IN ('PENDING', 'DELIVERED', 'FAILED', 'CANCELLED'));
