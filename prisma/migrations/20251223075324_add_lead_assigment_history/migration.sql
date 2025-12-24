-- CreateTable
CREATE TABLE `LeadAssignmentHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `fromSalesId` INTEGER NULL,
    `toSalesId` INTEGER NULL,
    `assignedById` INTEGER NULL,
    `assignedByRole` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadAssignmentHistory_leadId_idx`(`leadId`),
    INDEX `LeadAssignmentHistory_fromSalesId_idx`(`fromSalesId`),
    INDEX `LeadAssignmentHistory_toSalesId_idx`(`toSalesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeadAssignmentHistory` ADD CONSTRAINT `LeadAssignmentHistory_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadAssignmentHistory` ADD CONSTRAINT `LeadAssignmentHistory_fromSalesId_fkey` FOREIGN KEY (`fromSalesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadAssignmentHistory` ADD CONSTRAINT `LeadAssignmentHistory_toSalesId_fkey` FOREIGN KEY (`toSalesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadAssignmentHistory` ADD CONSTRAINT `LeadAssignmentHistory_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
