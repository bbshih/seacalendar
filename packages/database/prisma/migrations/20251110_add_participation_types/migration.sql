-- Add new engagement fields to User
ALTER TABLE "User" ADD COLUMN "lastMemorySharedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastInteractionAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "totalVirtualEvents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "totalMemoriesShared" INTEGER NOT NULL DEFAULT 0;
