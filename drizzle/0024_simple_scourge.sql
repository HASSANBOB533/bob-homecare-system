CREATE TABLE `staffAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffName` varchar(100) NOT NULL,
	`date` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeSlots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`capacity` int NOT NULL DEFAULT 1,
	`bookedCount` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeSlots_id` PRIMARY KEY(`id`)
);
