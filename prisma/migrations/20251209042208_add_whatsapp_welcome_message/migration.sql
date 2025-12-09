-- AlterTable
ALTER TABLE `general_settings` ADD COLUMN `welcomeMessageEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `welcomeMessageTemplate` TEXT NULL;
