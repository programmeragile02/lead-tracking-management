/*
  Warnings:

  - You are about to drop the column `nurturingCurrentStep` on the `lead` table. All the data in the column will be lost.
  - You are about to drop the column `nurturingLastSentAt` on the `lead` table. All the data in the column will be lost.
  - You are about to drop the column `nurturingPausedAt` on the `lead` table. All the data in the column will be lost.
  - You are about to drop the column `nurturingStartedAt` on the `lead` table. All the data in the column will be lost.
  - You are about to drop the column `nurturingStatus` on the `lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lead` DROP COLUMN `nurturingCurrentStep`,
    DROP COLUMN `nurturingLastSentAt`,
    DROP COLUMN `nurturingPausedAt`,
    DROP COLUMN `nurturingStartedAt`,
    DROP COLUMN `nurturingStatus`;

-- CreateTable
CREATE TABLE `nurturing_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nurturing_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nurturing_topics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `targetStatusCode` VARCHAR(191) NULL,
    `targetStageCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `nurturing_topics_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nurturing_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `slot` ENUM('A', 'B') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `waTemplateTitle` VARCHAR(191) NULL,
    `waTemplateBody` TEXT NULL,
    `waTemplateMedia` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `nurturing_templates_topicId_idx`(`topicId`),
    UNIQUE INDEX `nurturing_templates_topicId_slot_key`(`topicId`, `slot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nurturing_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `productId` INTEGER NULL,
    `targetStatusCode` VARCHAR(191) NULL,
    `sourceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nurturing_plans_code_key`(`code`),
    INDEX `nurturing_plans_productId_idx`(`productId`),
    INDEX `nurturing_plans_sourceId_idx`(`sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nurturing_plan_steps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `delayHours` INTEGER NOT NULL DEFAULT 24,
    `slot` ENUM('A', 'B') NOT NULL DEFAULT 'A',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `nurturing_plan_steps_planId_idx`(`planId`),
    INDEX `nurturing_plan_steps_topicId_idx`(`topicId`),
    UNIQUE INDEX `nurturing_plan_steps_planId_order_key`(`planId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_nurturing_states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `planId` INTEGER NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'STOPPED') NOT NULL DEFAULT 'ACTIVE',
    `currentStep` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NULL,
    `lastSentAt` DATETIME(3) NULL,
    `nextSendAt` DATETIME(3) NULL,
    `pausedAt` DATETIME(3) NULL,
    `lastMessageKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_nurturing_states_leadId_key`(`leadId`),
    INDEX `lead_nurturing_states_status_idx`(`status`),
    INDEX `lead_nurturing_states_nextSendAt_idx`(`nextSendAt`),
    INDEX `lead_nurturing_states_planId_idx`(`planId`),
    UNIQUE INDEX `lead_nurturing_states_lastMessageKey_key`(`lastMessageKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `lead_followups_leadId_doneAt_idx` ON `lead_followups`(`leadId`, `doneAt`);

-- CreateIndex
CREATE INDEX `lead_followups_leadId_nextActionAt_idx` ON `lead_followups`(`leadId`, `nextActionAt`);

-- CreateIndex
CREATE INDEX `lead_messages_leadId_direction_createdAt_idx` ON `lead_messages`(`leadId`, `direction`, `createdAt`);

-- AddForeignKey
ALTER TABLE `nurturing_topics` ADD CONSTRAINT `nurturing_topics_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `nurturing_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nurturing_templates` ADD CONSTRAINT `nurturing_templates_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `nurturing_topics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nurturing_plans` ADD CONSTRAINT `nurturing_plans_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nurturing_plans` ADD CONSTRAINT `nurturing_plans_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `lead_sources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nurturing_plan_steps` ADD CONSTRAINT `nurturing_plan_steps_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `nurturing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nurturing_plan_steps` ADD CONSTRAINT `nurturing_plan_steps_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `nurturing_topics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_nurturing_states` ADD CONSTRAINT `lead_nurturing_states_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_nurturing_states` ADD CONSTRAINT `lead_nurturing_states_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `nurturing_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
