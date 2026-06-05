ALTER TABLE `accounts` ADD `account_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_indexer` text;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_rate_type` text;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_rate` real;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_maturity_date` text;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_liquidity` text;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_invested_amount` real;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_gross_amount` real;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_net_amount` real;--> statement-breakpoint
ALTER TABLE `investment_portfolio_assets` ADD `fixed_income_tax_exempt` integer DEFAULT false;