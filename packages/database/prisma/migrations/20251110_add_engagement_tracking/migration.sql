-- Add engagement tracking to User
ALTER TABLE "User" ADD COLUMN "lastVotedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastAttendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "totalEventsCreated" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "totalEventsAttended" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "totalVotesCast" INTEGER NOT NULL DEFAULT 0;

-- Add recurring event tracking to Poll
ALTER TABLE "Poll" ADD COLUMN "recurringGroupId" TEXT;

-- CreateTable EventAttendance
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable RecurringEventGroup
CREATE TABLE "RecurringEventGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastOccurrence" TIMESTAMP(3),
    "totalOccurrences" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringEventGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_pollId_userId_key" ON "EventAttendance"("pollId", "userId");
CREATE INDEX "EventAttendance_userId_attendedAt_idx" ON "EventAttendance"("userId", "attendedAt");
CREATE INDEX "EventAttendance_pollId_idx" ON "EventAttendance"("pollId");

CREATE INDEX "RecurringEventGroup_guildId_idx" ON "RecurringEventGroup"("guildId");
CREATE INDEX "RecurringEventGroup_guildId_currentStreak_idx" ON "RecurringEventGroup"("guildId", "currentStreak");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_recurringGroupId_fkey" FOREIGN KEY ("recurringGroupId") REFERENCES "RecurringEventGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
