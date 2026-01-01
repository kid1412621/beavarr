import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey(),
    sonarrUrl: text('sonarr_url'),
    sonarrApiKey: text('sonarr_api_key'),
    radarrUrl: text('radarr_url'),
    radarrApiKey: text('radarr_api_key'),
    traktClientId: text('trakt_client_id'),
    traktClientSecret: text('trakt_client_secret'),
    tmdbApiKey: text('tmdb_api_key'),
    openaiApiKey: text('openai_api_key'),
    openaiBaseUrl: text('openai_base_url'),
    openaiModel: text('openai_model'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;
