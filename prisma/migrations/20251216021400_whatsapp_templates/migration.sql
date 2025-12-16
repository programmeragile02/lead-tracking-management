-- CreateTable
CREATE TABLE `whatsapp_message_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scope` ENUM('GLOBAL', 'USER') NOT NULL DEFAULT 'GLOBAL',
    `ownerId` INTEGER NULL,
    `parentId` INTEGER NULL,
    `code` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `whatsapp_message_templates_scope_isActive_idx`(`scope`, `isActive`),
    INDEX `whatsapp_message_templates_ownerId_isActive_idx`(`ownerId`, `isActive`),
    INDEX `whatsapp_message_templates_parentId_idx`(`parentId`),
    UNIQUE INDEX `whatsapp_message_templates_ownerId_parentId_key`(`ownerId`, `parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `whatsapp_message_templates` ADD CONSTRAINT `whatsapp_message_templates_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_message_templates` ADD CONSTRAINT `whatsapp_message_templates_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `whatsapp_message_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
