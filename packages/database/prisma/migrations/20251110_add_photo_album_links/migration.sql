-- Add Google Photos album fields to EventFollowup
ALTER TABLE "EventFollowup" ADD COLUMN "photoAlbumUrl" TEXT;
ALTER TABLE "EventFollowup" ADD COLUMN "photoAlbumId" TEXT;
