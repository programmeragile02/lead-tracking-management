-- CreateTable
CREATE TABLE `sales_target_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesId` INTEGER NOT NULL,
    `leadTargetPerDay` INTEGER NOT NULL DEFAULT 0,
    `closingTargetAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_target_settings_salesId_key`(`salesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales_target_settings` ADD CONSTRAINT `sales_target_settings_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
