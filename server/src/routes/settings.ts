import { Hono } from 'hono';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '../db/utils';

const settingsRoute = new Hono();

settingsRoute.get('/', async (c) => {
    try {
        const currentSettings = await getSettings();
        if (!currentSettings) {
            return c.json({});
        }
        // Return settings (client should handle masking if needed, but for now we send back what's stored)
        return c.json(currentSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

settingsRoute.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const existing = await getSettings();

        if (existing) {
            // Update existing
            const updated = await db.update(settings)
                .set(body)
                .where(eq(settings.id, existing.id))
                .returning();
            return c.json(updated[0]);
        } else {
            // Create new
            const inserted = await db.insert(settings).values(body).returning();
            return c.json(inserted[0]);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        return c.json({ error: 'Failed to update settings' }, 500);
    }
});

export default settingsRoute;
