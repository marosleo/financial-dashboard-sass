/*
  Warnings:

  - A unique constraint covering the columns `[pluggyAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pluggyTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'POSTED');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "bankConnectionId" TEXT,
ADD COLUMN     "pluggyAccountId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "pluggyProviderId" TEXT,
ADD COLUMN     "pluggyTransactionId" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED';

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "connectorId" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executionStatus" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "consentExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PluggyWebhookEvent" (
    "id" TEXT NOT NULL,
    "pluggyEventId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "itemId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PluggyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_pluggyItemId_key" ON "BankConnection"("pluggyItemId");

-- CreateIndex
CREATE INDEX "BankConnection_userId_status_idx" ON "BankConnection"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PluggyWebhookEvent_pluggyEventId_key" ON "PluggyWebhookEvent"("pluggyEventId");

-- CreateIndex
CREATE INDEX "PluggyWebhookEvent_status_createdAt_idx" ON "PluggyWebhookEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PluggyWebhookEvent_itemId_idx" ON "PluggyWebhookEvent"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_pluggyAccountId_key" ON "Account"("pluggyAccountId");

-- CreateIndex
CREATE INDEX "Account_bankConnectionId_idx" ON "Account"("bankConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_pluggyTransactionId_key" ON "Transaction"("pluggyTransactionId");

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
