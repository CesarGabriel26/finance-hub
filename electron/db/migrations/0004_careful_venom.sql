CREATE TABLE `account_statement_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`period` text NOT NULL,
	`statement_start_date` text,
	`statement_end_date` text,
	`initial_balance` real,
	`final_balance` real,
	`total_credits` real DEFAULT 0 NOT NULL,
	`total_debits` real DEFAULT 0 NOT NULL,
	`net_amount` real DEFAULT 0 NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`bank_name` text,
	`account_number` text,
	`file_name` text,
	`imported_at` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_statement_balances_account` ON `account_statement_balances` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_statement_balances_period` ON `account_statement_balances` (`period`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_statement_balance_account_period` ON `account_statement_balances` (`account_id`,`period`);