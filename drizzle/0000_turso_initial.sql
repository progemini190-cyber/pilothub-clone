CREATE TABLE `aiModels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`targetRole` text(64) NOT NULL,
	`modelString` text NOT NULL,
	`isActive` text DEFAULT 'true',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aiModels_targetRole_unique` ON `aiModels` (`targetRole`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(256) NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`isActive` text DEFAULT 'true' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apiKeys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text(64) NOT NULL,
	`keyValue` text NOT NULL,
	`isActive` text DEFAULT 'false',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fullName` text NOT NULL,
	`email` text(320) NOT NULL,
	`phone` text(20),
	`businessName` text,
	`businessType` text(128),
	`useCase` text,
	`plan` text(64) DEFAULT 'free',
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text(32) DEFAULT 'website',
	`userId` integer,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`modelSlug` text(64) NOT NULL,
	`title` text,
	`summary` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `externalApiTokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(128) NOT NULL,
	`token` text(256) NOT NULL,
	`isActive` text DEFAULT 'true',
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `externalApiTokens_token_unique` ON `externalApiTokens` (`token`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`role` text(64) NOT NULL,
	`content` text NOT NULL,
	`tokenCount` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`userName` text,
	`userEmail` text(320),
	`plan` text(64) NOT NULL,
	`amount` integer NOT NULL,
	`currency` text(10) DEFAULT 'MMK' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paymentMethod` text(64),
	`transactionRef` text(255),
	`screenshotUrl` text,
	`notes` text,
	`source` text(32) DEFAULT 'website',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `systemPrompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`modelSlug` text(64) NOT NULL,
	`content` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`isActive` text DEFAULT 'false',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(128) NOT NULL,
	`value` text,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `systemSettings_key_unique` ON `systemSettings` (`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text(64) NOT NULL,
	`name` text,
	`email` text(320),
	`businessName` text,
	`businessType` text(128),
	`useCase` text,
	`phone` text(20),
	`loginMethod` text(64),
	`role` text DEFAULT 'user' NOT NULL,
	`plan` text(64) DEFAULT 'free',
	`status` text(64) DEFAULT 'active',
	`subscriptionStart` integer,
	`subscriptionEnd` integer,
	`notes` text,
	`freeBizCount` integer DEFAULT 5 NOT NULL,
	`freeFounderCount` integer DEFAULT 5 NOT NULL,
	`planTypeBiz` text DEFAULT 'free' NOT NULL,
	`planTypeFounder` text DEFAULT 'free' NOT NULL,
	`bizMessageLimit` integer DEFAULT 5 NOT NULL,
	`founderMessageLimit` integer DEFAULT 5 NOT NULL,
	`bizMessagesUsed` integer DEFAULT 0 NOT NULL,
	`founderMessagesUsed` integer DEFAULT 0 NOT NULL,
	`hasUsedBizStarter` text DEFAULT 'false' NOT NULL,
	`hasUsedFounderStarter` text DEFAULT 'false' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);