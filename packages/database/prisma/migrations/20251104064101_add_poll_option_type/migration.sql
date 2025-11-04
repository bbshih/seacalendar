-- CreateEnum
CREATE TYPE "PollOptionType" AS ENUM ('DATE', 'TEXT');

-- AlterTable
ALTER TABLE "PollOption" ADD COLUMN "optionType" "PollOptionType" NOT NULL DEFAULT 'DATE';
