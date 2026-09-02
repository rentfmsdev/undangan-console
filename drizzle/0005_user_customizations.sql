ALTER TABLE `invitations`
  ADD COLUMN IF NOT EXISTS `title` varchar(120) NOT NULL DEFAULT 'Undangan baru' AFTER `user_id`;
--> statement-breakpoint

CREATE INDEX `invitations_user_updated_idx` ON `invitations` (`user_id`, `updated_at`);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
