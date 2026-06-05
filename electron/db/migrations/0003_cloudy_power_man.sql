CREATE TABLE `investment_portfolio_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`broker` text,
	`sector` text,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`quantity` real NOT NULL,
	`average_price` real NOT NULL,
	`current_price` real NOT NULL,
	`purchase_date` text,
	`target_allocation` real DEFAULT 0 NOT NULL,
	`dividend_yield` real DEFAULT 0 NOT NULL,
	`annual_income` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`portfolio_id`) REFERENCES `investment_portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_investment_portfolio_assets_portfolio` ON `investment_portfolio_assets` (`portfolio_id`);--> statement-breakpoint
CREATE INDEX `idx_investment_portfolio_assets_ticker` ON `investment_portfolio_assets` (`ticker`);--> statement-breakpoint
CREATE INDEX `idx_investment_portfolio_assets_type` ON `investment_portfolio_assets` (`type`);--> statement-breakpoint
CREATE TABLE `investment_portfolios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`strategy` text DEFAULT 'balanced' NOT NULL,
	`risk_profile` text DEFAULT 'moderate' NOT NULL,
	`benchmark` text DEFAULT 'CDI',
	`currency` text DEFAULT 'BRL' NOT NULL,
	`beginner_mode` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text,
	`updated_at` text
);
