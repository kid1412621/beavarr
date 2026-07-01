import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey(),
    sonarrUrl: text('sonarr_url'),
    sonarrApiKey: text('sonarr_api_key'),
    radarrUrl: text('radarr_url'),
    radarrApiKey: text('radarr_api_key'),
    traktClientId: text('trakt_client_id'),
    traktClientSecret: text('trakt_client_secret'),
    traktAccessToken: text('trakt_access_token'),
    traktRefreshToken: text('trakt_refresh_token'),
    traktTokenExpiresAt: integer('trakt_token_expires_at', {
        mode: 'timestamp',
    }),
    tmdbApiKey: text('tmdb_api_key'),
    jellyfinUrl: text('jellyfin_url'),
    jellyfinApiKey: text('jellyfin_api_key'),
    posterSource: text('poster_source'),
    openaiApiKey: text('openai_api_key'),
    openaiBaseUrl: text('openai_base_url'),
    openaiModel: text('openai_model'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
        () => new Date(),
    ),
    userId: integer('user_id')
        .references(() => users.id)
        .unique(),
});

export const users = sqliteTable('users', {
    id: integer('id').primaryKey(),
    username: text('username').unique().notNull(),
    password: text('password').notNull(),
    isPasswordChanged: integer('is_password_changed', { mode: 'boolean' })
        .default(false)
        .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
        () => new Date(),
    ),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Cache tables for media
export const movies = sqliteTable('movies', {
    tmdbId: integer('tmdb_id').primaryKey(),
    title: text('title').notNull(),
    releaseDate: text('release_date'),
    overview: text('overview'),
    posterPath: text('poster_path'),
    radarrId: integer('radarr_id'), // Nullable
    jellyfinId: text('jellyfin_id'), // Nullable
    inLibrary: integer('in_library', { mode: 'boolean' })
        .default(false)
        .notNull(),
    libraryStatus: text('library_status'),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
        () => new Date(),
    ),
});

export const shows = sqliteTable('shows', {
    tvdbId: integer('tvdb_id').primaryKey(),
    tmdbId: integer('tmdb_id'), // TMDB ID (if resolved)
    title: text('title').notNull(),
    releaseDate: text('release_date'),
    overview: text('overview'),
    posterPath: text('poster_path'),
    sonarrId: integer('sonarr_id'), // Nullable
    jellyfinId: text('jellyfin_id'), // Nullable
    inLibrary: integer('in_library', { mode: 'boolean' })
        .default(false)
        .notNull(),
    libraryStatus: text('library_status'),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
        () => new Date(),
    ),
});

export const franchises = sqliteTable('franchises', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
        () => new Date(),
    ),
});

export const franchiseItems = sqliteTable('franchise_items', {
    id: integer('id').primaryKey(),
    franchiseId: integer('franchise_id')
        .references(() => franchises.id, { onDelete: 'cascade' })
        .notNull(),
    mediaType: text('media_type').notNull(), // 'movie' | 'show'
    mediaId: integer('media_id').notNull(),
    order: integer('order').notNull(),
    seasonNumber: integer('season_number'),
});

export type Movie = typeof movies.$inferSelect;
export type InsertMovie = typeof movies.$inferInsert;

export type Show = typeof shows.$inferSelect;
export type InsertShow = typeof shows.$inferInsert;

export type Franchise = typeof franchises.$inferSelect;
export type InsertFranchise = typeof franchises.$inferInsert;

export type FranchiseItem = typeof franchiseItems.$inferSelect;
export type InsertFranchiseItem = typeof franchiseItems.$inferInsert;
