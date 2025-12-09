/*
  Warnings:

  - You are about to drop the column `educationLinkUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `educationPdfUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `testimonialUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `videoDemoUrl` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `products` DROP COLUMN `educationLinkUrl`,
    DROP COLUMN `educationPdfUrl`,
    DROP COLUMN `testimonialUrl`,
    DROP COLUMN `videoDemoUrl`;
