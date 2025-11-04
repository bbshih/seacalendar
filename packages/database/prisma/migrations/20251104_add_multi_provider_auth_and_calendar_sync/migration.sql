-- CreateEnum for new auth provider types
CREATE TYPE "AuthProviderType" AS ENUM ('DISCORD', 'GOOGLE', 'LOCAL');
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE');
CREATE TYPE "SyncStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISABLED', 'EXPIRED');

-- AlterTable User - make Discord fields nullable, add new fields
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "discordUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "discordLinkedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "discordLinkDeadline" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "requireDiscordLink" BOOLEAN NOT NULL DEFAULT false;

-- Make discordId nullable for users who sign up with username/password first
ALTER TABLE "User" ALTER COLUMN "discordId" DROP NOT NULL;

-- Populate discordUsername for existing users from username field
UPDATE "User" SET "discordUsername" = username, "discordLinkedAt" = "createdAt" WHERE "discordId" IS NOT NULL;

-- Add unique constraint on username
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateTable AuthProvider
CREATE TABLE "AuthProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "providerData" JSONB,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalendarConnection
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL DEFAULT 'GOOGLE',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showBusyTimes" BOOLEAN NOT NULL DEFAULT true,
    "showEventTitles" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'ACTIVE',
    "syncError" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalendarEvent
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "status" TEXT,
    "transparency" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthProvider_userId_idx" ON "AuthProvider"("userId");
CREATE INDEX "AuthProvider_provider_providerId_idx" ON "AuthProvider"("provider", "providerId");
CREATE UNIQUE INDEX "AuthProvider_provider_providerId_key" ON "AuthProvider"("provider", "providerId");
CREATE UNIQUE INDEX "AuthProvider_userId_provider_key" ON "AuthProvider"("userId", "provider");

CREATE INDEX "CalendarConnection_userId_syncEnabled_idx" ON "CalendarConnection"("userId", "syncEnabled");
CREATE UNIQUE INDEX "CalendarConnection_userId_provider_key" ON "CalendarConnection"("userId", "provider");

CREATE INDEX "CalendarEvent_calendarConnectionId_startTime_endTime_idx" ON "CalendarEvent"("calendarConnectionId", "startTime", "endTime");
CREATE INDEX "CalendarEvent_startTime_endTime_idx" ON "CalendarEvent"("startTime", "endTime");
CREATE UNIQUE INDEX "CalendarEvent_calendarConnectionId_providerEventId_key" ON "CalendarEvent"("calendarConnectionId", "providerEventId");

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing Discord auth to AuthProvider table
INSERT INTO "AuthProvider" ("id", "userId", "provider", "providerId", "linkedAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "id" as "userId",
    'DISCORD'::"AuthProviderType" as "provider",
    "discordId" as "providerId",
    "createdAt" as "linkedAt",
    "updatedAt"
FROM "User"
WHERE "discordId" IS NOT NULL;
