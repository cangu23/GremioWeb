-- CreateTable
CREATE TABLE "StreamerProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "description" TEXT,
    "lore" TEXT,
    "socialLinks" TEXT,
    "twitchUrl" TEXT,
    "youtubeUrl" TEXT,
    "kickUrl" TEXT,
    "tiktokUrl" TEXT,
    "twitterUrl" TEXT,
    "discordUrl" TEXT,
    "websiteUrl" TEXT,
    "kofiUrl" TEXT,
    "streamSchedule" TEXT,
    "languages" TEXT,
    "contentType" TEXT,
    "live2dModel" TEXT,
    "model3d" TEXT,
    "fanName" TEXT,
    "oshiMark" TEXT,
    "hashtags" TEXT,
    "themeColor" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "lastLiveAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StreamerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StreamerProfile_userId_key" ON "StreamerProfile"("userId");

-- CreateIndex
CREATE INDEX "StreamerProfile_displayName_idx" ON "StreamerProfile"("displayName");

-- CreateIndex
CREATE INDEX "StreamerProfile_isVerified_idx" ON "StreamerProfile"("isVerified");

-- CreateIndex
CREATE INDEX "StreamerProfile_isApproved_idx" ON "StreamerProfile"("isApproved");

-- AddForeignKey
ALTER TABLE "StreamerProfile" ADD CONSTRAINT "StreamerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (rol STREAMER): discriminador de solicitudes VTUBER/STREAMER
ALTER TABLE "VtuberRequest" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'VTUBER';

-- CreateIndex
CREATE INDEX "VtuberRequest_type_idx" ON "VtuberRequest"("type");
