-- AlterTable
ALTER TABLE `lead` ADD COLUMN `subStatusId` INTEGER NULL;

-- CreateTable
CREATE TABLE `lead_sub_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `statusId` INTEGER NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_sub_statuses_code_key`(`code`),
    INDEX `lead_sub_statuses_statusId_idx`(`statusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_sub_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `subStatusId` INTEGER NOT NULL,
    `changedById` INTEGER NULL,
    `salesId` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_sub_status_histories_leadId_idx`(`leadId`),
    INDEX `lead_sub_status_histories_subStatusId_idx`(`subStatusId`),
    INDEX `lead_sub_status_histories_salesId_idx`(`salesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_subStatusId_fkey` FOREIGN KEY (`subStatusId`) REFERENCES `lead_sub_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_sub_statuses` ADD CONSTRAINT `lead_sub_statuses_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `LeadStatus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_sub_status_histories` ADD CONSTRAINT `lead_sub_status_histories_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_sub_status_histories` ADD CONSTRAINT `lead_sub_status_histories_subStatusId_fkey` FOREIGN KEY (`subStatusId`) REFERENCES `lead_sub_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_sub_status_histories` ADD CONSTRAINT `lead_sub_status_histories_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_sub_status_histories` ADD CONSTRAINT `lead_sub_status_histories_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
