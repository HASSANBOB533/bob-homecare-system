CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteCode` varchar(12) NOT NULL,
	`serviceId` int NOT NULL,
	`selections` json NOT NULL,
	`totalPrice` int NOT NULL,
	`userId` int,
	`customerName` varchar(255),
	`customerEmail` varchar(255),
	`customerPhone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`convertedToBooking` boolean NOT NULL DEFAULT false,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quoteCode_unique` UNIQUE(`quoteCode`)
);
--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;