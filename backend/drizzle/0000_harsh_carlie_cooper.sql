CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pride_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`answers_json` text NOT NULL,
	`saved_at` text NOT NULL
);
