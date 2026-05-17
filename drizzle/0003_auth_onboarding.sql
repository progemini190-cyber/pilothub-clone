ALTER TABLE `users` ADD COLUMN `passwordHash` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` integer;
