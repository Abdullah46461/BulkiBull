-- CreateEnum
CREATE TYPE "BullSex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Bull" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "breed" TEXT,
    "sex" "BullSex" NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "initialWeight" DECIMAL(8,2) NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bull_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightRecord" (
    "id" TEXT NOT NULL,
    "bullId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weight" DECIMAL(8,2) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bull_tagNumber_key" ON "Bull"("tagNumber");

-- CreateIndex
CREATE INDEX "Bull_tagNumber_idx" ON "Bull"("tagNumber");

-- CreateIndex
CREATE INDEX "Bull_createdAt_idx" ON "Bull"("createdAt");

-- CreateIndex
CREATE INDEX "WeightRecord_bullId_date_idx" ON "WeightRecord"("bullId", "date");

-- AddForeignKey
ALTER TABLE "WeightRecord" ADD CONSTRAINT "WeightRecord_bullId_fkey" FOREIGN KEY ("bullId") REFERENCES "Bull"("id") ON DELETE CASCADE ON UPDATE CASCADE;
