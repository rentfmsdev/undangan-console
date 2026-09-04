-- Migrations 0000-0009 already create the core schema. The original generated
-- version of this migration attempted to create those tables a second time,
-- which made a fresh installation fail. Only invitation_guests is new here.
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
