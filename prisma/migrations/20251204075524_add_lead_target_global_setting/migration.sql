/*
  Warnings:

  - You are about to drop the `sales_target_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `sales_target_settings` DROP FOREIGN KEY `sales_target_settings_salesId_fkey`;

-- DropTable
DROP TABLE `sales_target_settings`;

-- CreateTable
CREATE TABLE `lead_target_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `leadTargetPerDay` INTEGER NOT NULL DEFAULT 0,
    `closingTargetAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
