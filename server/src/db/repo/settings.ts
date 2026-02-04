import { eq } from 'drizzle-orm';

import type { InsertSettings } from '../schema';

import { db } from '../index';
import { settings } from '../schema';

export async function getSettings() {
    const result = await db.select().from(settings).limit(1);
    return result[0] || null;
}

export async function getOrCreateSettings() {
    const current = await getSettings();
    if (current) return current;

    const inserted = await db.insert(settings).values({}).returning();
    return inserted[0];
}

export async function updateSettings(updates: Partial<InsertSettings>) {
    const existing = await getSettings();
    if (existing) {
        const updated = await db
            .update(settings)
            .set(updates)
            .where(eq(settings.id, existing.id))
            .returning();
        return updated[0];
    } else {
        const inserted = await db.insert(settings).values(updates).returning();
        return inserted[0];
    }
}
