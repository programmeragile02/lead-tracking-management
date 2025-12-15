-- AlterTable
ALTER TABLE `lead` ADD COLUMN `importedAt` DATETIME(3) NULL,
    ADD COLUMN `importedById` INTEGER NULL,
    ADD COLUMN `importedFromExcel` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_importedById_fkey` FOREIGN KEY (`importedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
