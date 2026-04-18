-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('hay', 'compound_feed');

-- CreateTable
CREATE TABLE "FeedStock" (
    "id" TEXT NOT NULL,
    "type" "FeedType" NOT NULL,
    "currentStockKg" DECIMAL(10,2) NOT NULL,
    "consumptionPerBullPerDayKg" DECIMAL(8,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedStock_type_key" ON "FeedStock"("type");
