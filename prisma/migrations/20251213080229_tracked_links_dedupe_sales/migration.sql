-- CreateTable
CREATE TABLE `lead_tracked_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `salesId` INTEGER NOT NULL,
    `leadMessageId` INTEGER NULL,
    `kind` ENUM('DEMO', 'TESTIMONIAL', 'EDUCATION', 'FILE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `slug` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `targetUrl` TEXT NOT NULL,
    `productId` INTEGER NULL,
    `planId` INTEGER NULL,
    `stepOrder` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lead_tracked_links_code_key`(`code`),
    INDEX `lead_tracked_links_leadId_idx`(`leadId`),
    INDEX `lead_tracked_links_salesId_idx`(`salesId`),
    INDEX `lead_tracked_links_leadMessageId_idx`(`leadMessageId`),
    INDEX `lead_tracked_links_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_tracked_link_clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linkId` INTEGER NOT NULL,
    `leadId` INTEGER NOT NULL,
    `salesId` INTEGER NOT NULL,
    `clickedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `isPreview` BOOLEAN NOT NULL DEFAULT false,

    INDEX `lead_tracked_link_clicks_linkId_idx`(`linkId`),
    INDEX `lead_tracked_link_clicks_leadId_idx`(`leadId`),
    INDEX `lead_tracked_link_clicks_salesId_idx`(`salesId`),
    UNIQUE INDEX `lead_tracked_link_clicks_linkId_leadId_key`(`linkId`, `leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lead_tracked_links` ADD CONSTRAINT `lead_tracked_links_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_tracked_links` ADD CONSTRAINT `lead_tracked_links_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_tracked_links` ADD CONSTRAINT `lead_tracked_links_leadMessageId_fkey` FOREIGN KEY (`leadMessageId`) REFERENCES `lead_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_tracked_link_clicks` ADD CONSTRAINT `lead_tracked_link_clicks_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `lead_tracked_links`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_tracked_link_clicks` ADD CONSTRAINT `lead_tracked_link_clicks_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_tracked_link_clicks` ADD CONSTRAINT `lead_tracked_link_clicks_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
