-- CreateTable
CREATE TABLE `sales_excluded_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sales_excluded_contacts_salesId_idx`(`salesId`),
    INDEX `sales_excluded_contacts_phone_idx`(`phone`),
    UNIQUE INDEX `sales_excluded_contacts_salesId_phone_key`(`salesId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sales_excluded_contacts` ADD CONSTRAINT `sales_excluded_contacts_salesId_fkey` FOREIGN KEY (`salesId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
