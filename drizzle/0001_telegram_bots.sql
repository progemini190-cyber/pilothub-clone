ALTER TABLE `users` ADD `telegramChatId` text;
--> statement-breakpoint
CREATE TABLE `bot_activation_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text(64) NOT NULL,
	`userId` integer NOT NULL,
	`isUsed` text DEFAULT 'false' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bot_activation_tokens_token_unique` ON `bot_activation_tokens` (`token`);
