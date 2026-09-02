CREATE TABLE IF NOT EXISTS `users` (
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

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` char(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

ALTER TABLE `invitations` ADD COLUMN IF NOT EXISTS `user_id` char(36);
