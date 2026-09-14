CREATE TABLE `root_admin_audit_logs` (
	`id` char(36) NOT NULL,
	`actor_user_id` char(36),
	`action` varchar(64) NOT NULL,
	`target_user_id` char(36),
	`ip_address` varchar(64),
	`user_agent` varchar(512),
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `root_admin_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `root_admin_credentials` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`password_salt` varchar(64) NOT NULL,
	`must_change_password` int NOT NULL DEFAULT 1,
	`failed_attempts` int NOT NULL DEFAULT 0,
	`locked_until` datetime,
	`last_login_at` datetime,
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `root_admin_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `root_admin_credentials_username_unique` UNIQUE(`username`),
	CONSTRAINT `root_admin_credentials_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE INDEX `root_admin_audit_logs_actor_idx` ON `root_admin_audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `root_admin_audit_logs_action_idx` ON `root_admin_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `root_admin_audit_logs_created_at_idx` ON `root_admin_audit_logs` (`created_at`);