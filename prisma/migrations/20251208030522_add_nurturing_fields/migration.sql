-- AlterTable
ALTER TABLE `lead` ADD COLUMN `nurturingCurrentStep` INTEGER NULL,
    ADD COLUMN `nurturingLastSentAt` DATETIME(3) NULL,
    ADD COLUMN `nurturingStartedAt` DATETIME(3) NULL,
    ADD COLUMN `nurturingStatus` ENUM('ACTIVE', 'PAUSED', 'STOPPED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `lead_followup_types` ADD COLUMN `autoDelayHours` INTEGER NULL,
    ADD COLUMN `autoOnLeadCreate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isNurturingStep` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nurturingOrder` INTEGER NULL,
    ADD COLUMN `targetStatusCode` VARCHAR(191) NULL,
    ADD COLUMN `waTemplateBody` TEXT NULL,
    ADD COLUMN `waTemplateMedia` VARCHAR(191) NULL,
    ADD COLUMN `waTemplateTitle` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `lead_followups` ADD COLUMN `isAutoNurturing` BOOLEAN NOT NULL DEFAULT false;
