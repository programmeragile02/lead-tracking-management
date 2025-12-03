-- AlterTable
ALTER TABLE `users` ADD COLUMN `managerId` INTEGER NULL,
    ADD COLUMN `teamLeaderId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_teamLeaderId_fkey` FOREIGN KEY (`teamLeaderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
