-- CreateTable QotwQuestion
CREATE TABLE "QotwQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "submitterUsername" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesAsked" INTEGER NOT NULL DEFAULT 0,
    "lastAskedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "QotwQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable QotwConfig
CREATE TABLE "QotwConfig" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT,
    "cronSchedule" TEXT NOT NULL DEFAULT '0 21 * * 0',
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAskedAt" TIMESTAMP(3),
    "lastPollAt" TIMESTAMP(3),
    "nextQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QotwConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable QotwHistory
CREATE TABLE "QotwHistory" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QotwHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QotwQuestion_guildId_isDeleted_timesAsked_idx" ON "QotwQuestion"("guildId", "isDeleted", "timesAsked");
CREATE INDEX "QotwQuestion_guildId_submittedAt_idx" ON "QotwQuestion"("guildId", "submittedAt");

CREATE UNIQUE INDEX "QotwConfig_guildId_key" ON "QotwConfig"("guildId");
CREATE INDEX "QotwConfig_guildId_enabled_idx" ON "QotwConfig"("guildId", "enabled");

CREATE INDEX "QotwHistory_questionId_idx" ON "QotwHistory"("questionId");
CREATE INDEX "QotwHistory_guildId_askedAt_idx" ON "QotwHistory"("guildId", "askedAt");

-- AddForeignKey
ALTER TABLE "QotwHistory" ADD CONSTRAINT "QotwHistory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QotwQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
