-- CreateTable
CREATE TABLE `LeadStageHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `stageId` INTEGER NOT NULL,
    `changedById` INTEGER NULL,
    `salesId` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadStageHistory_leadId_idx`(`leadId`),
    INDEX `LeadStageHistory_stageId_idx`(`stageId`),
    INDEX `LeadStageHistory_salesId_idx`(`salesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `statusId` INTEGER NOT NULL,
    `changedById` INTEGER NULL,
    `salesId` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadStatusHistory_leadId_idx`(`leadId`),
    INDEX `LeadStatusHistory_statusId_idx`(`statusId`),
    INDEX `LeadStatusHistory_salesId_idx`(`salesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeadStageHistory` ADD CONSTRAINT `LeadStageHistory_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStageHistory` ADD CONSTRAINT `LeadStageHistory_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `LeadStage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStageHistory` ADD CONSTRAINT `LeadStageHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStageHistory` ADD CONSTRAINT `LeadStageHistory_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStatusHistory` ADD CONSTRAINT `LeadStatusHistory_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStatusHistory` ADD CONSTRAINT `LeadStatusHistory_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `LeadStatus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStatusHistory` ADD CONSTRAINT `LeadStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadStatusHistory` ADD CONSTRAINT `LeadStatusHistory_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
