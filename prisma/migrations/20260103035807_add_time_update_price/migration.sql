-- AlterTable
ALTER TABLE `lead` ADD COLUMN `priceClosingAt` DATETIME(3) NULL,
    ADD COLUMN `priceNegotiationAt` DATETIME(3) NULL,
    ADD COLUMN `priceOfferingAt` DATETIME(3) NULL;
