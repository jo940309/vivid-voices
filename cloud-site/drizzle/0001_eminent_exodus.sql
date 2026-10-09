CREATE TABLE `event_archives` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`object_key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
