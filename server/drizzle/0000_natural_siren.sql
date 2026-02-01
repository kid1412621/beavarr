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
	`updated_at` integer
);
