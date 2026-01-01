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
    tmdb_api_key TEXT,
    openai_api_key TEXT,
    openai_base_url TEXT,
    openai_model TEXT,
    updated_at INTEGER
  )
`);

try {
  sqlite.run("ALTER TABLE settings ADD COLUMN openai_model TEXT");
} catch (error) {
  // Column likely already exists, ignore
}
