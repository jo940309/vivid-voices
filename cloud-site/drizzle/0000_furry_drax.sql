CREATE TABLE `google_voters` (
	`hash` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'ready' NOT NULL,
	`winner` integer
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`identity` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY NOT NULL,
	`group_id` integer NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`song` text NOT NULL,
	`members` text NOT NULL,
	`photo` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`round` integer NOT NULL,
	`voter` text NOT NULL,
	`team` integer NOT NULL,
	PRIMARY KEY(`round`, `voter`)
);
