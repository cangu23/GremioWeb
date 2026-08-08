-- AlterTable: reactions stored as TEXT (JSON) for cross-provider compatibility (SQLite has no JSON type)
ALTER TABLE "DirectMessage" ALTER COLUMN "reactions" TYPE TEXT USING ("reactions"::text);
