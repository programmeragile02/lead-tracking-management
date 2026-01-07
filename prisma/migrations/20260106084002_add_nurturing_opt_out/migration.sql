-- CreateTable
CREATE TABLE `lead_nurturing_opt_outs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `salesId` INTEGER NULL,
    `phone` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_nurturing_opt_outs_leadId_idx`(`leadId`),
    INDEX `lead_nurturing_opt_outs_salesId_idx`(`salesId`),
    INDEX `lead_nurturing_opt_outs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_nurturing_opt_outs` ADD CONSTRAINT `lead_nurturing_opt_outs_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_nurturing_opt_outs` ADD CONSTRAINT `lead_nurturing_opt_outs_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
