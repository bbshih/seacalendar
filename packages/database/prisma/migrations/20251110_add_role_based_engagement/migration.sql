-- Add event location type to Poll
CREATE TYPE "EventLocationType" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');
ALTER TABLE "Poll" ADD COLUMN "locationType" "EventLocationType" NOT NULL DEFAULT 'IN_PERSON';

-- CreateTable GuildMemberRole
CREATE TABLE "GuildMemberRole" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildMemberRole_guildId_userId_roleId_key" ON "GuildMemberRole"("guildId", "userId", "roleId");
CREATE INDEX "GuildMemberRole_guildId_roleId_idx" ON "GuildMemberRole"("guildId", "roleId");
CREATE INDEX "GuildMemberRole_userId_idx" ON "GuildMemberRole"("userId");
