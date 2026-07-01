CREATE TABLE `franchise_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`franchise_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`media_id` integer NOT NULL,
	`order` integer NOT NULL,
	`season_number` integer,
	FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `franchises` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `franchises_slug_unique` ON `franchises` (`slug`);--> statement-breakpoint
CREATE TABLE `movies` (
	`tmdb_id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`release_date` text,
	`overview` text,
	`poster_path` text,
	`radarr_id` integer,
	`jellyfin_id` text,
	`in_library` integer DEFAULT false NOT NULL,
	`library_status` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `shows` (
	`tvdb_id` integer PRIMARY KEY NOT NULL,
	`tmdb_id` integer,
	`title` text NOT NULL,
	`release_date` text,
	`overview` text,
	`poster_path` text,
	`sonarr_id` integer,
	`jellyfin_id` text,
	`in_library` integer DEFAULT false NOT NULL,
	`library_status` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer
);