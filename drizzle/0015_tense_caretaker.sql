CREATE TABLE `addOnTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`addOnId` int NOT NULL,
	`bedrooms` int NOT NULL,
	`price` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addOnTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `addOns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`description` text,
	`descriptionEn` text,
	`price` int NOT NULL,
	`pricingType` enum('FIXED','PER_BEDROOM','SIZE_TIERED') NOT NULL DEFAULT 'FIXED',
	`sizeTierThreshold` int,
	`sizeTierMultiplier` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addOns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packageDiscounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`visits` int NOT NULL,
	`discountPercentage` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packageDiscounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`itemName` varchar(100) NOT NULL,
	`itemNameEn` varchar(100) NOT NULL,
	`price` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingSqm` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`pricePerSqm` int NOT NULL,
	`minimumCharge` int,
	`tier` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingSqm_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`bedrooms` int NOT NULL,
	`price` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialOffers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`description` text,
	`descriptionEn` text,
	`offerType` enum('REFERRAL','PROPERTY_MANAGER','EMERGENCY_SAME_DAY') NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` int NOT NULL,
	`minProperties` int,
	`maxDiscount` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `specialOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `services` ADD `pricingType` enum('BEDROOM_BASED','SQM_BASED','ITEM_BASED','FIXED') DEFAULT 'FIXED' NOT NULL;--> statement-breakpoint
ALTER TABLE `addOnTiers` ADD CONSTRAINT `addOnTiers_addOnId_addOns_id_fk` FOREIGN KEY (`addOnId`) REFERENCES `addOns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `addOns` ADD CONSTRAINT `addOns_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packageDiscounts` ADD CONSTRAINT `packageDiscounts_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricingItems` ADD CONSTRAINT `pricingItems_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricingSqm` ADD CONSTRAINT `pricingSqm_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricingTiers` ADD CONSTRAINT `pricingTiers_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;