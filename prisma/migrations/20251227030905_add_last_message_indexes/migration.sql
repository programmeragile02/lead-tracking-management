-- CreateIndex
CREATE INDEX `Lead_salesId_lastMessageAt_idx` ON `Lead`(`salesId`, `lastMessageAt`);

-- CreateIndex
CREATE INDEX `Lead_salesId_statusId_lastMessageAt_idx` ON `Lead`(`salesId`, `statusId`, `lastMessageAt`);

-- CreateIndex
CREATE INDEX `Lead_lastMessageAt_id_idx` ON `Lead`(`lastMessageAt`, `id`);
