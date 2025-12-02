CREATE TABLE `favoriteServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favoriteServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favoriteServices` ADD CONSTRAINT `favoriteServices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favoriteServices` ADD CONSTRAINT `favoriteServices_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE cascade ON UPDATE no action;