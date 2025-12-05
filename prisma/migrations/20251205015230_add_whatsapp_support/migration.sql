-- CreateTable
CREATE TABLE `whatsapp_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `waUserJid` VARCHAR(191) NULL,
    `status` ENUM('PENDING_QR', 'CONNECTED', 'DISCONNECTED', 'ERROR') NOT NULL DEFAULT 'PENDING_QR',
    `lastConnectedAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `whatsapp_sessions_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `salesId` INTEGER NULL,
    `channel` ENUM('WHATSAPP', 'NOTE') NOT NULL,
    `direction` ENUM('INBOUND', 'OUTBOUND') NOT NULL,
    `waMessageId` VARCHAR(191) NULL,
    `waChatId` VARCHAR(191) NULL,
    `fromNumber` VARCHAR(191) NULL,
    `toNumber` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_messages_waMessageId_key`(`waMessageId`),
    INDEX `lead_messages_leadId_idx`(`leadId`),
    INDEX `lead_messages_salesId_idx`(`salesId`),
    INDEX `lead_messages_channel_direction_idx`(`channel`, `direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `whatsapp_sessions` ADD CONSTRAINT `whatsapp_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_messages` ADD CONSTRAINT `lead_messages_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_messages` ADD CONSTRAINT `lead_messages_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
