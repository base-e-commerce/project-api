-- CreateTable
CREATE TABLE `CommandeDetail` (
    `detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `commande_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(65, 30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commande` (
    `commande_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `order_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `total_amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `shipping_address` VARCHAR(191) NULL,
    `shipping_address_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `admin_id` INTEGER NULL,

    PRIMARY KEY (`commande_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `payment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `commande_id` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `payment_method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `transaction_date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommandeDetail` ADD CONSTRAINT `CommandeDetail_commande_id_fkey` FOREIGN KEY (`commande_id`) REFERENCES `Commande`(`commande_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommandeDetail` ADD CONSTRAINT `CommandeDetail_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commande` ADD CONSTRAINT `Commande_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commande` ADD CONSTRAINT `Commande_shipping_address_id_fkey` FOREIGN KEY (`shipping_address_id`) REFERENCES `Adresse`(`address_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commande` ADD CONSTRAINT `Commande_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_commande_id_fkey` FOREIGN KEY (`commande_id`) REFERENCES `Commande`(`commande_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
