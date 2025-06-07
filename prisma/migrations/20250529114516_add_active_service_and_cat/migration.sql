-- AlterTable
ALTER TABLE `customer` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `service` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
