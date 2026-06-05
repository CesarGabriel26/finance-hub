CREATE TABLE `category_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`keyword` text NOT NULL,
	`category_id` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`created_by_user` integer DEFAULT true NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_category_rules_keyword` ON `category_rules` (`keyword`);--> statement-breakpoint
CREATE INDEX `idx_category_rules_category` ON `category_rules` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_category_rules_keyword` ON `category_rules` (`keyword`);--> statement-breakpoint
ALTER TABLE `categories` ADD `is_fixed` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `categories`
SET `is_fixed` = true
WHERE `name` IN ('Moradia', 'Impostos & Taxas', 'Seguros')
	OR `icon` IN ('medical_services', 'school', 'work');--> statement-breakpoint
ALTER TABLE `accounts_payable` ADD `is_recurring` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_payable` ADD `recurrence_classification` text;--> statement-breakpoint
ALTER TABLE `accounts_payable` ADD `total_installments` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_payable` ADD `current_installment` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_payable` ADD `settlement_transaction_id` text;--> statement-breakpoint
ALTER TABLE `accounts_receivable` ADD `is_recurring` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_receivable` ADD `recurrence_classification` text;--> statement-breakpoint
ALTER TABLE `accounts_receivable` ADD `total_installments` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_receivable` ADD `current_installment` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts_receivable` ADD `settlement_transaction_id` text;
