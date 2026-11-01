-- CreateTable
CREATE TABLE "CreatorCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paypalEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorEarningsLog" (
    "id" TEXT NOT NULL,
    "creatorCodeId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "orderId" TEXT,
    "itemType" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "creatorCommission" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorEarningsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorCode_userId_key" ON "CreatorCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorCode_code_key" ON "CreatorCode"("code");

-- CreateIndex
CREATE INDEX "CreatorCode_code_idx" ON "CreatorCode"("code");

-- CreateIndex
CREATE INDEX "CreatorPayout_userId_idx" ON "CreatorPayout"("userId");

-- CreateIndex
CREATE INDEX "CreatorPayout_status_idx" ON "CreatorPayout"("status");

-- CreateIndex
CREATE INDEX "CreatorEarningsLog_creatorCodeId_idx" ON "CreatorEarningsLog"("creatorCodeId");

-- CreateIndex
CREATE INDEX "CreatorEarningsLog_buyerId_idx" ON "CreatorEarningsLog"("buyerId");

-- CreateIndex
CREATE INDEX "CreatorEarningsLog_createdAt_idx" ON "CreatorEarningsLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CreatorCode" ADD CONSTRAINT "CreatorCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorCodeId_fkey" FOREIGN KEY ("creatorCodeId") REFERENCES "CreatorCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarningsLog" ADD CONSTRAINT "CreatorEarningsLog_creatorCodeId_fkey" FOREIGN KEY ("creatorCodeId") REFERENCES "CreatorCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarningsLog" ADD CONSTRAINT "CreatorEarningsLog_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
