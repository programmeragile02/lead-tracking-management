-- AlterTable
ALTER TABLE `lead_messages` ADD COLUMN `sentById` INTEGER NULL,
    ADD COLUMN `sentByRole` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `lead_messages` ADD CONSTRAINT `lead_messages_sentById_fkey` FOREIGN KEY (`sentById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
