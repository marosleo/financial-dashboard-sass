-- CreateEnum
CREATE TYPE "CategorySource" AS ENUM ('PROVIDER', 'RULE', 'USER', 'AI');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "categoryConfidence" DOUBLE PRECISION,
ADD COLUMN     "categorySource" "CategorySource" NOT NULL DEFAULT 'PROVIDER';

-- CreateTable
CREATE TABLE "CategorizationRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "merchantKey" TEXT NOT NULL,
    "merchantLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorizationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategorizationRule_categoryId_idx" ON "CategorizationRule"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorizationRule_userId_merchantKey_key" ON "CategorizationRule"("userId", "merchantKey");

-- AddForeignKey
ALTER TABLE "CategorizationRule" ADD CONSTRAINT "CategorizationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorizationRule" ADD CONSTRAINT "CategorizationRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
