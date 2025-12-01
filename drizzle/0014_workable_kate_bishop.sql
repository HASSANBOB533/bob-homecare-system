ALTER TABLE `bookings` ADD `paymentId` varchar(255);--> statement-breakpoint
ALTER TABLE `bookings` ADD `paymentStatus` enum('pending','success','failed') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` ADD `amount` int;--> statement-breakpoint
ALTER TABLE `services` ADD `price` int DEFAULT 0 NOT NULL;