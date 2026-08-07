-- AlterTable: add claimDate (YYYY-MM-DD UTC) for the anti double-claim guard.
ALTER TABLE "DailyReward" ADD COLUMN "claimDate" TEXT;

-- Backfill existing rows from their claim timestamp.
UPDATE "DailyReward" SET "claimDate" = to_char("claimedAt", 'YYYY-MM-DD') WHERE "claimDate" IS NULL;

-- Deduplicate any pre-existing rows that already violate the new unique
-- constraint (same user claiming twice on the same day), keeping the earliest.
DELETE FROM "DailyReward" a
USING "DailyReward" b
WHERE a."userId" = b."userId"
  AND a."claimDate" = b."claimDate"
  AND a."id" > b."id";

-- CreateIndex: at most one claim per user per day (prevents parallel double-claims).
CREATE UNIQUE INDEX "DailyReward_userId_claimDate_key" ON "DailyReward"("userId", "claimDate");
