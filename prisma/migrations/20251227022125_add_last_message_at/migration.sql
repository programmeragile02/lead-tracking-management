-- AlterTable
ALTER TABLE `lead` ADD COLUMN `lastMessageAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Lead_lastMessageAt_idx` ON `Lead`(`lastMessageAt`);
