ALTER TABLE `domain_publish_requests` ADD COLUMN `template_price` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `domain_publish_requests` ADD COLUMN `additional_service_fee` int;
--> statement-breakpoint
ALTER TABLE `domain_publish_requests` ADD COLUMN `estimated_total` int;
