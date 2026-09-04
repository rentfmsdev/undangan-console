-- Reconciles databases created while migrations 0010/0011 had timestamps older
-- than 0009. IF NOT EXISTS keeps this safe for installations where the tables
-- were created manually before the migration journal was repaired.
CREATE TABLE IF NOT EXISTS `invitation_guests` (
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
	CONSTRAINT `invitation_guests_id` PRIMARY KEY(`id`),
	INDEX `invitation_guests_invitation_id_idx` (`invitation_id`),
	INDEX `invitation_guests_invitation_slug_idx` (`invitation_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_outbox` (
	`id` char(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`last_error` text,
	`sent_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_outbox_id` PRIMARY KEY(`id`),
	INDEX `email_outbox_status_idx` (`status`),
	INDEX `email_outbox_recipient_idx` (`recipient`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitation_activity_logs` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36),
	`action` varchar(64) NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_activity_logs_id` PRIMARY KEY(`id`),
	INDEX `invitation_activity_logs_invitation_id_idx` (`invitation_id`),
	INDEX `invitation_activity_logs_action_idx` (`action`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitation_collaboration_snapshots` (
	`id` varchar(36) NOT NULL,
	`invitation_id` varchar(36) NOT NULL,
	`revision` bigint NOT NULL DEFAULT 1,
	`schema_version` int NOT NULL DEFAULT 1,
	`snapshot` text NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_collaboration_snapshots_id` PRIMARY KEY(`id`),
	INDEX `snap_invitation_idx` (`invitation_id`),
	INDEX `snap_revision_idx` (`invitation_id`,`revision`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitation_collaborators` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36),
	`email` varchar(255) NOT NULL,
	`role` enum('editor','viewer') NOT NULL DEFAULT 'editor',
	`invite_token_hash` varchar(64) NOT NULL,
	`status` enum('pending','accepted','declined','expired','revoked') NOT NULL DEFAULT 'pending',
	`invited_by` char(36) NOT NULL,
	`expires_at` datetime,
	`accepted_at` datetime,
	`declined_at` datetime,
	`revoked_at` datetime,
	`last_seen_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitation_collaborators_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_collaborators_unique` UNIQUE(`invitation_id`,`email`),
	INDEX `invitation_collaborators_user_id_idx` (`user_id`),
	INDEX `invitation_collaborators_email_idx` (`email`),
	INDEX `invitation_collaborators_status_idx` (`status`),
	INDEX `invitation_collaborators_token_hash_idx` (`invite_token_hash`)
);
