-- AlterTable
ALTER TABLE "User" ALTER COLUMN "discriminator" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
