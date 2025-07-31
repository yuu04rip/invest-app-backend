-- DropForeignKey
ALTER TABLE `AlbumAccess` DROP FOREIGN KEY `AlbumAccess_albumId_fkey`;

-- DropForeignKey
ALTER TABLE `AlbumAccess` DROP FOREIGN KEY `AlbumAccess_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_creatorUserId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_usedByUserId_fkey`;

-- DropIndex
DROP INDEX `AlbumAccess_albumId_fkey` ON `AlbumAccess`;

-- DropIndex
DROP INDEX `AlbumAccess_userId_fkey` ON `AlbumAccess`;

-- DropIndex
DROP INDEX `Referral_creatorUserId_fkey` ON `Referral`;

-- DropIndex
DROP INDEX `Referral_usedByUserId_fkey` ON `Referral`;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_creatorUserId_fkey` FOREIGN KEY (`creatorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_usedByUserId_fkey` FOREIGN KEY (`usedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlbumAccess` ADD CONSTRAINT `AlbumAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlbumAccess` ADD CONSTRAINT `AlbumAccess_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
