-- AlterTable
ALTER TABLE `lead` ADD COLUMN `lastInboundAt` DATETIME(3) NULL,
    ADD COLUMN `lastOutboundAt` DATETIME(3) NULL;
