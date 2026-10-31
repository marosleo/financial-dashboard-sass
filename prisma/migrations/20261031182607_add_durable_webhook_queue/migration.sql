-- AlterTable
ALTER TABLE "PluggyWebhookEvent" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PluggyWebhookEvent_status_nextAttemptAt_idx" ON "PluggyWebhookEvent"("status", "nextAttemptAt");
