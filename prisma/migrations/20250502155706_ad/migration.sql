-- AlterTable
ALTER TABLE `categorie` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `contactinfo` ADD COLUMN `seen` BOOLEAN NULL DEFAULT false,
    MODIFY `subject` TEXT NOT NULL,
    MODIFY `message` TEXT NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `description` TEXT NULL,
    MODIFY `descriptionRich` TEXT NULL;

-- AlterTable
ALTER TABLE `service` MODIFY `description` TEXT NULL;
