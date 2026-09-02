CREATE TABLE `email_outbox` (
	`id` char(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`last_error` text,
	`sent_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_outbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_activity_logs` (
	`id` char(36) NOT NULL,
	`invitation_id` char(36) NOT NULL,
	`user_id` char(36),
	`action` varchar(64) NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_collaboration_snapshots` (
	`id` varchar(36) NOT NULL,
	`invitation_id` varchar(36) NOT NULL,
	`revision` bigint NOT NULL DEFAULT 1,
	`schema_version` int NOT NULL DEFAULT 1,
	`snapshot` text NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_collaboration_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_collaborators` (
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
	CONSTRAINT `invitation_collaborators_unique` UNIQUE(`invitation_id`,`email`)
);
--> statement-breakpoint
CREATE INDEX `email_outbox_status_idx` ON `email_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `email_outbox_recipient_idx` ON `email_outbox` (`recipient`);--> statement-breakpoint
CREATE INDEX `invitation_activity_logs_invitation_id_idx` ON `invitation_activity_logs` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `invitation_activity_logs_action_idx` ON `invitation_activity_logs` (`action`);--> statement-breakpoint
CREATE INDEX `snap_invitation_idx` ON `invitation_collaboration_snapshots` (`invitation_id`);--> statement-breakpoint
CREATE INDEX `snap_revision_idx` ON `invitation_collaboration_snapshots` (`invitation_id`,`revision`);--> statement-breakpoint
CREATE INDEX `invitation_collaborators_user_id_idx` ON `invitation_collaborators` (`user_id`);--> statement-breakpoint
CREATE INDEX `invitation_collaborators_email_idx` ON `invitation_collaborators` (`email`);--> statement-breakpoint
CREATE INDEX `invitation_collaborators_status_idx` ON `invitation_collaborators` (`status`);--> statement-breakpoint
CREATE INDEX `invitation_collaborators_token_hash_idx` ON `invitation_collaborators` (`invite_token_hash`);