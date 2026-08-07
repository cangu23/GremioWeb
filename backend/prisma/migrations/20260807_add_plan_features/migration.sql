-- AlterTable: verification purchasable until date
ALTER TABLE "User" ADD COLUMN "verifiedUntil" TIMESTAMP(3);

-- AlterTable: STELLAR video banner
ALTER TABLE "VTuberProfile" ADD COLUMN "bannerVideoUrl" TEXT;

-- AlterTable: VIP exclusive events (STELLAR)
ALTER TABLE "Event" ADD COLUMN "isVip" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: stickers can be gated by plan tier
ALTER TABLE "Sticker" ADD COLUMN "minPlan" TEXT NOT NULL DEFAULT 'FREE';

-- CreateTable: PostReaction (animated reactions for NOVA+)
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostReaction_postId_userId_emoji_key" ON "PostReaction"("postId", "userId", "emoji");
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateTable: ProfileView (advanced profile stats for NOVA+)
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewedUserId" TEXT NOT NULL,
    "viewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfileView_viewedUserId_createdAt_idx" ON "ProfileView"("viewedUserId", "createdAt");
CREATE INDEX "ProfileView_viewerId_idx" ON "ProfileView"("viewerId");

-- CreateTable: GroupConversation (group DMs for NOVA+)
CREATE TABLE "GroupConversation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupConversation_createdById_idx" ON "GroupConversation"("createdById");

CREATE TABLE "GroupConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupConversationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupConversationMember_conversationId_userId_key" ON "GroupConversationMember"("conversationId", "userId");
CREATE INDEX "GroupConversationMember_userId_idx" ON "GroupConversationMember"("userId");

CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupMessage_conversationId_createdAt_idx" ON "GroupMessage"("conversationId", "createdAt");
CREATE INDEX "GroupMessage_senderId_idx" ON "GroupMessage"("senderId");

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewedUserId_fkey" FOREIGN KEY ("viewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GroupConversation" ADD CONSTRAINT "GroupConversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupConversationMember" ADD CONSTRAINT "GroupConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "GroupConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupConversationMember" ADD CONSTRAINT "GroupConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "GroupConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
