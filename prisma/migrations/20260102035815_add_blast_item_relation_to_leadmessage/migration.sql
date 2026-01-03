-- AlterTable
ALTER TABLE `leadblastitem` ADD COLUMN `leadMessageId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `LeadBlastItem` ADD CONSTRAINT `LeadBlastItem_leadMessageId_fkey` FOREIGN KEY (`leadMessageId`) REFERENCES `lead_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
