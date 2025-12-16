-- CreateTable
CREATE TABLE `lead_ai_insights` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `requestedById` INTEGER NULL,
    `type` ENUM('WHATSAPP_ANALYSIS') NOT NULL DEFAULT 'WHATSAPP_ANALYSIS',
    `lastMessageId` INTEGER NULL,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `model` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lead_ai_insights_leadId_createdAt_idx`(`leadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_ai_insights` ADD CONSTRAINT `lead_ai_insights_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_ai_insights` ADD CONSTRAINT `lead_ai_insights_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
