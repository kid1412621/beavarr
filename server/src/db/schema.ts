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
