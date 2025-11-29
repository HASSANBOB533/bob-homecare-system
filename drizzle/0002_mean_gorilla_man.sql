ALTER TABLE `services` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `nameEn` varchar(255);--> statement-breakpoint
ALTER TABLE `services` ADD `descriptionEn` text;--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `price`;