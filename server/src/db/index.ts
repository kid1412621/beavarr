import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { resolve } from 'path';

import { createLogger } from '../lib/logger';
import * as schema from './schema';

const logger = createLogger('db');

// Resolve relative to the custom DATA_DIR, falling back to the current working directory.
const dataDir = process.env.DATA_DIR || process.cwd();
const dbPath = resolve(dataDir, 'sqlite.db');
const migrationsFolder = resolve(dataDir, 'drizzle');

import { getLogger } from '@logtape/drizzle-orm';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema, logger: getLogger() });

// Initialize database - run migrations
await migrate(db, {
    migrationsFolder,
});

logger.info("Database initialized");
