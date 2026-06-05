CREATE TABLE `investment_asset_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`portfolio_id` text NOT NULL,
	`snapshot_date` text NOT NULL,
	`invested_amount` real DEFAULT 0 NOT NULL,
	`gross_amount` real DEFAULT 0 NOT NULL,
	`net_amount` real DEFAULT 0 NOT NULL,
	`result_amount` real DEFAULT 0 NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`current_price` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text,
	FOREIGN KEY (`asset_id`) REFERENCES `investment_portfolio_assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`portfolio_id`) REFERENCES `investment_portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_investment_asset_snapshots_asset` ON `investment_asset_snapshots` (`asset_id`);--> statement-breakpoint
CREATE INDEX `idx_investment_asset_snapshots_portfolio` ON `investment_asset_snapshots` (`portfolio_id`);--> statement-breakpoint
CREATE INDEX `idx_investment_asset_snapshots_date` ON `investment_asset_snapshots` (`snapshot_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_investment_asset_snapshot_date` ON `investment_asset_snapshots` (`asset_id`,`snapshot_date`);--> statement-breakpoint
CREATE TABLE `monthly_closings` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`income_total` real DEFAULT 0 NOT NULL,
	`expense_total` real DEFAULT 0 NOT NULL,
	`balance_total` real DEFAULT 0 NOT NULL,
	`invested_total` real DEFAULT 0 NOT NULL,
	`budget_limit_total` real DEFAULT 0 NOT NULL,
	`budget_spent_total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'closed' NOT NULL,
	`notes` text,
	`closed_at` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_monthly_closings_period` ON `monthly_closings` (`period`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_monthly_closings_period` ON `monthly_closings` (`period`);--> statement-breakpoint
CREATE TABLE `account_reconciliations` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`period` text NOT NULL,
	`system_balance` real DEFAULT 0 NOT NULL,
	`statement_balance` real,
	`real_balance` real DEFAULT 0 NOT NULL,
	`difference` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`reconciled_at` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_account_reconciliations_account` ON `account_reconciliations` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_account_reconciliations_period` ON `account_reconciliations` (`period`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_account_reconciliation_period` ON `account_reconciliations` (`account_id`,`period`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `tags` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `target_kind` text DEFAULT 'maximum' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `alert_percent` real DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `notes` text;