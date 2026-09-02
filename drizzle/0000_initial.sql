CREATE TABLE `templates` (
  `id` varchar(64) NOT NULL,
  `code` char(5) NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `category` varchar(32) NOT NULL,
  `name` varchar(120) NOT NULL,
  `manifest` json NOT NULL,
  `is_active` int NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `templates_code_unique` (`code`)
);
--> statement-breakpoint

CREATE TABLE `invitations` (
  `id` char(36) NOT NULL,
  `edit_token_hash` char(64) NOT NULL,
  `template_id` varchar(64) NOT NULL,
  `template_version` int NOT NULL,
  `theme_id` varchar(64) NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `publish_mode` enum('path','subdomain'),
  `slug` varchar(63),
  `subdomain` varchar(63),
  `recovery_code_hash` char(64),
  `published_at` datetime,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitations_slug_unique` (`slug`),
  UNIQUE KEY `invitations_subdomain_unique` (`subdomain`)
);
--> statement-breakpoint

CREATE TABLE `invitation_sections` (
  `id` char(36) NOT NULL,
  `invitation_id` char(36) NOT NULL,
  `type` varchar(64) NOT NULL,
  `section_order` int NOT NULL,
  `enabled` int NOT NULL DEFAULT 1,
  `data` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitation_sections_order_unique` (`invitation_id`,`section_order`),
  KEY `invitation_sections_invitation_id_index` (`invitation_id`)
);
--> statement-breakpoint

CREATE TABLE `invitation_assets` (
  `id` char(36) NOT NULL,
  `invitation_id` char(36) NOT NULL,
  `kind` enum('image','audio') NOT NULL,
  `url` varchar(1024) NOT NULL,
  `alt` varchar(255),
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invitation_assets_invitation_id_index` (`invitation_id`)
);
--> statement-breakpoint

CREATE TABLE `wishes` (
  `id` char(36) NOT NULL,
  `invitation_id` char(36) NOT NULL,
  `guest_name` varchar(120) NOT NULL,
  `attendance` enum('hadir','tidak_hadir','masih_ragu') NOT NULL DEFAULT 'masih_ragu',
  `message` varchar(1000) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wishes_invitation_id_index` (`invitation_id`)
);
--> statement-breakpoint

INSERT INTO `templates` (`id`, `code`, `version`, `category`, `name`, `manifest`)
VALUES (
  'wedding-lampung-elegance',
  'hjydg',
  1,
  'wedding',
  'Wedding Lampung Elegance',
  JSON_OBJECT('id', 'wedding-lampung-elegance', 'code', 'hjydg', 'version', 1)
);
