CREATE TABLE `domain_publish_requests` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`domain` varchar(253) NOT NULL,
	`tld` enum('com','id','co','space') NOT NULL,
	`status` enum('requested','processing','registered','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`availability_source` enum('rdap','whois') NOT NULL,
	`availability_checked_at` datetime NOT NULL,
	`template_price` int NOT NULL,
	`additional_service_fee` int,
	`estimated_total` int,
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domain_publish_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_publish_requests_invitation_unique` UNIQUE(`invitation_id`),
	CONSTRAINT `domain_publish_requests_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `invitation_assets` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`kind` enum('image','audio') NOT NULL,
	`url` varchar(1024) NOT NULL,
	`alt` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_guests` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`phone` varchar(30),
	`group` varchar(60) NOT NULL DEFAULT 'Umum',
	`status` enum('pending','sent') NOT NULL DEFAULT 'pending',
	`sent_at` datetime,
	`opened_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitation_guests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_sections` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`section_order` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`data` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitation_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_sections_order_unique` UNIQUE(`invitation_id`,`section_order`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`title` varchar(120) NOT NULL DEFAULT 'Undangan baru',
	`edit_token_hash` char(64) NOT NULL,
	`template_id` varchar(64) NOT NULL,
	`template_version` int NOT NULL,
	`theme_id` varchar(64) NOT NULL,
	`style_overrides` json NOT NULL,
	`status` enum('draft','published','custom','archived') NOT NULL DEFAULT 'draft',
	`publish_mode` enum('path','subdomain','custom_domain'),
	`slug` varchar(63),
	`subdomain` varchar(63),
	`recovery_code_hash` char(64),
	`published_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `invitations_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(128) NOT NULL,
	`user_id` char(36) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` varchar(64) NOT NULL,
	`code` char(5) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`category` varchar(32) NOT NULL,
	`name` varchar(120) NOT NULL,
	`manifest` json NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `templates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(120) NOT NULL,
	`avatar_url` varchar(1024),
	`google_id` varchar(128),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`)
);
--> statement-breakpoint
CREATE TABLE `wishes` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`guest_name` varchar(120) NOT NULL,
	`attendance` enum('hadir','tidak_hadir','masih_ragu') NOT NULL DEFAULT 'masih_ragu',
	`message` varchar(1000) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `domain_publish_requests_user_status_idx` ON `domain_publish_requests` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `invitation_assets_invitation_id_index` ON `invitation_assets` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `invitation_guests_invitation_id_idx` ON `invitation_guests` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `invitation_guests_invitation_slug_idx` ON `invitation_guests` (`invitation_id`,`slug`);--> statement-breakpoint
CREATE INDEX `invitations_user_updated_idx` ON `invitations` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `wishes_invitation_id_index` ON `wishes` (`invitation_id`);