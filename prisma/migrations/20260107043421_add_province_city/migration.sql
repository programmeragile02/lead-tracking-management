-- AlterTable
ALTER TABLE `lead` ADD COLUMN `cityId` INTEGER NULL,
    ADD COLUMN `provinceId` INTEGER NULL;

-- CreateTable
CREATE TABLE `provinces` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `provinces_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `provinceId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('KOTA', 'KABUPATEN') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cities_code_key`(`code`),
    INDEX `cities_provinceId_idx`(`provinceId`),
    INDEX `cities_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `cities_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
