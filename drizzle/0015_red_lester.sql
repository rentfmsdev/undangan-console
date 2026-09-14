CREATE TABLE `platform_settings` (
	`key` varchar(128) NOT NULL,
	`value` json NOT NULL,
	`updated_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE INDEX `platform_settings_updated_at_idx` ON `platform_settings` (`updated_at`);