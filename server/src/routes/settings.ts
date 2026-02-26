import { Hono } from 'hono';
import { type SettingsForm } from 'shared';

import { getOrCreateSettings, updateSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { radarrService } from '../services/radarr';
import { sonarrService } from '../services/sonarr';

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
    })
    .post('/test-connection', async (c) => {
        try {
            const { type, url, apiKey } = await c.req.json<{
                type: 'sonarr' | 'radarr';
                url: string;
                apiKey: string;
            }>();

            let success = false;
            if (type === 'sonarr') {
                success = await sonarrService.testConnection(url, apiKey);
            } else if (type === 'radarr') {
                success = await radarrService.testConnection(url, apiKey);
            }

            return c.json({ success });
        } catch (error) {
            logger.error("Error testing connection: {error}", { error });
            return c.json({ success: false, error: 'Connection test failed' });
        }
    });

export default settingsRoute;
