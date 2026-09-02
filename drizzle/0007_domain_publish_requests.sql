CREATE TABLE `domain_publish_requests` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`domain` varchar(253) NOT NULL,
	`tld` enum('com','id','co') NOT NULL,
	`status` enum('requested','processing','registered','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`availability_source` enum('rdap','whois') NOT NULL,
	`availability_checked_at` datetime NOT NULL,
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domain_publish_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_publish_requests_invitation_unique` UNIQUE(`invitation_id`),
	CONSTRAINT `domain_publish_requests_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE INDEX `domain_publish_requests_user_status_idx` ON `domain_publish_requests` (`user_id`,`status`);
