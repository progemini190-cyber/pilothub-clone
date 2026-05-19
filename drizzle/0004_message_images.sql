-- Optional image attachments on web chat messages (applied via ensureChatSchema at runtime too)
ALTER TABLE `messages` ADD COLUMN `imageData` text;
