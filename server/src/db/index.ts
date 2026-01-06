import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { resolve } from "path"; // Import resolve from Node.js path module
import * as schema from "./schema";

const sqlite = new Database(resolve(import.meta.dir, "../../sqlite.db"));
export const db = drizzle(sqlite, { schema });

// Initialize database - create tables if they don't exist
sqlite.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    sonarr_url TEXT,
    sonarr_api_key TEXT,
    radarr_url TEXT,
    radarr_api_key TEXT,
    trakt_client_id TEXT,
    trakt_client_secret TEXT,
    trakt_access_token TEXT,
    trakt_refresh_token TEXT,
    trakt_token_expires_at INTEGER,
    tmdb_api_key TEXT,
    openai_api_key TEXT,
    openai_base_url TEXT,
    openai_model TEXT,
    updated_at INTEGER
  )
`);

// Add new columns for OAuth tokens if they don't exist
try {
  sqlite.run("ALTER TABLE settings ADD COLUMN trakt_access_token TEXT");
} catch {
  // Column already exists
}
try {
  sqlite.run("ALTER TABLE settings ADD COLUMN trakt_refresh_token TEXT");
} catch {
  // Column already exists
}
try {
  sqlite.run("ALTER TABLE settings ADD COLUMN trakt_token_expires_at INTEGER");
} catch {
  // Column already exists
}
try {
  sqlite.run("ALTER TABLE settings ADD COLUMN openai_model TEXT");
} catch {
  // Column already exists
}
