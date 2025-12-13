-- AlterTable
ALTER TABLE `leadstagehistory` ADD COLUMN `mode` ENUM('NORMAL', 'SKIPPED') NOT NULL DEFAULT 'NORMAL';
