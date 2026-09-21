CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`due` integer NOT NULL,
	`days` integer NOT NULL,
	`reviews` integer NOT NULL
);
