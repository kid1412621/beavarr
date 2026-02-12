CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`sonarr_url` text,
	`sonarr_api_key` text,
	`radarr_url` text,
	`radarr_api_key` text,
	`trakt_client_id` text,
	`trakt_client_secret` text,
	`trakt_access_token` text,
	`trakt_refresh_token` text,
	`trakt_token_expires_at` integer,
	`tmdb_api_key` text,
	`poster_source` text,
	`openai_api_key` text,
	`openai_base_url` text,
	`openai_model` text,
	`updated_at` integer,
	`user_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_id_unique` ON `settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`is_password_changed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2026-02-12T09:49:03.660Z"' NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);