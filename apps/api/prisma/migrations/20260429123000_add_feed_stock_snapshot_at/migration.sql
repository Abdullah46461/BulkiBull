-- Add an explicit business timestamp for the stock snapshot used in feed depletion math.
ALTER TABLE "FeedStock"
ADD COLUMN "stockSnapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows should keep their previous business behavior, which was implicitly tied to updatedAt.
UPDATE "FeedStock"
SET "stockSnapshotAt" = "updatedAt";
