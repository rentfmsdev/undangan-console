ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone` varchar(30) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `phone` varchar(30) NULL DEFAULT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payments` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`reference_id` varchar(128),
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'IDR',
	`mode` enum('path','subdomain','custom_domain') NOT NULL DEFAULT 'path',
	`identifier` varchar(255) NOT NULL,
	`payment_method` varchar(32) NOT NULL DEFAULT 'QR',
	`payment_channel` varchar(32) NOT NULL DEFAULT 'QRIS',
	`status` enum('pending','paid','expired','failed') NOT NULL DEFAULT 'pending',
	`customer_name` varchar(120),
	`customer_email` varchar(255),
	`customer_phone` varchar(30),
	`raw_response` json,
	`paid_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `payments_invitation_id_idx` ON `payments` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `payments_user_id_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_reference_id_idx` ON `payments` (`reference_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);