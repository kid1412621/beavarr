import { eq } from 'drizzle-orm';

import type { InsertSettings } from '../schema';

import { db } from '../index';
import { settings } from '../schema';

export async function getSettings(userId: number) {
    const result = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
    return result[0] || null;
}

export async function getOrCreateSettings(userId: number) {
    const current = await getSettings(userId);
    if (current) return current;

    const inserted = await db.insert(settings).values({ userId }).returning();
    return inserted[0];
}

export async function updateSettings(
    userId: number,
    updates: Partial<InsertSettings>,
) {
    const existing = await getSettings(userId);
    if (existing) {
        const updated = await db
            .update(settings)
            .set(updates)
            .where(eq(settings.id, existing.id))
            .returning();
        return updated[0];
    } else {
        const inserted = await db
            .insert(settings)
            .values({ ...updates, userId })
            .returning();
        return inserted[0];
    }
}
