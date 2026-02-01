import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { resolve } from "path";
import { createLogger } from "../lib/logger";
import * as schema from "./schema";

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const logger = createLogger("db");

const sqlite = new Database(resolve(import.meta.dir, "../../sqlite.db"));
export const db = drizzle(sqlite, { schema });

// Initialize database - run migrations
await migrate(db, { migrationsFolder: resolve(import.meta.dir, "../../drizzle") });
