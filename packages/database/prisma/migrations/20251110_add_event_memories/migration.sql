-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('REFLECTION', 'PHOTO', 'HIGHLIGHT');

-- CreateEnum
CREATE TYPE "FollowupStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- CreateTable EventMemory
CREATE TABLE "EventMemory" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "content" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable MemoryReaction
CREATE TABLE "MemoryReaction" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "reactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventFollowup
CREATE TABLE "EventFollowup" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "FollowupStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "channelId" TEXT,

    CONSTRAINT "EventFollowup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventMemory_pollId_submittedAt_idx" ON "EventMemory"("pollId", "submittedAt");
CREATE INDEX "EventMemory_userId_idx" ON "EventMemory"("userId");

CREATE INDEX "MemoryReaction_memoryId_idx" ON "MemoryReaction"("memoryId");
CREATE UNIQUE INDEX "MemoryReaction_memoryId_userId_emoji_key" ON "MemoryReaction"("memoryId", "userId", "emoji");

CREATE UNIQUE INDEX "EventFollowup_pollId_key" ON "EventFollowup"("pollId");
CREATE INDEX "EventFollowup_status_scheduledFor_idx" ON "EventFollowup"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "EventMemory" ADD CONSTRAINT "EventMemory_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryReaction" ADD CONSTRAINT "MemoryReaction_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "EventMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFollowup" ADD CONSTRAINT "EventFollowup_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
