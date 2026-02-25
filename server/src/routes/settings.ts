import { Hono } from 'hono';
import { type SettingsForm } from 'shared';

import { getOrCreateSettings, updateSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';

const logger = createLogger('settings');
const settingsRoute = new Hono<Env>()
    .get('/', async (c) => {
        try {
            const user = c.get('user');
            // If user is not in context (should be if auth middleware is running correctly),
            // we should probably error or fallback.
            // Given the setup, auth middleware runs before API routes.
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const currentSettings = await getOrCreateSettings(user.id);
            return c.json(currentSettings);
        } catch (error) {
            logger.error("Error fetching settings: {error}", { error });
            return c.json({ error: 'Failed to fetch settings' }, 500);
        }
    })
    .post('/', async (c) => {
        try {
            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const body = await c.req.json<SettingsForm>();
            const updated = await updateSettings(user.id, body);
            return c.json(updated);
        } catch (error) {
            logger.error("Error updating settings: {error}", { error });
            return c.json({ error: 'Failed to update settings' }, 500);
        }
    });

export default settingsRoute;
