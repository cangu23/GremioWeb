-- AlterTable: persistent reactions on DMs (emoji -> array de userIds)
ALTER TABLE "DirectMessage" ADD COLUMN "reactions" JSONB;
