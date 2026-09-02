ALTER TABLE `invitations` MODIFY COLUMN `status` enum('draft','published','custom','archived') NOT NULL DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE `invitations` MODIFY COLUMN `publish_mode` enum('path','subdomain','custom_domain');
