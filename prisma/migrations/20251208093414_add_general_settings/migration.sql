-- CreateTable
CREATE TABLE `general_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `companyName` VARCHAR(191) NOT NULL DEFAULT 'Perusahaan Kami',
    `autoNurturingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `maxIdleHoursBeforeResume` INTEGER NOT NULL DEFAULT 48,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
