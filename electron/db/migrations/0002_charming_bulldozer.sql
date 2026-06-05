CREATE TABLE `accounts_payable` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`payee` text DEFAULT '' NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`paid_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`account_id` text,
	`category_id` text,
	`notes` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_payable_due_date` ON `accounts_payable` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_accounts_payable_status` ON `accounts_payable` (`status`);--> statement-breakpoint
CREATE TABLE `accounts_receivable` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`payer` text DEFAULT '' NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`received_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`account_id` text,
	`category_id` text,
	`notes` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_receivable_due_date` ON `accounts_receivable` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_accounts_receivable_status` ON `accounts_receivable` (`status`);