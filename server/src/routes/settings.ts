import { Hono } from 'hono';
import { type ServiceStatusResponse, type SettingsForm } from 'shared';

import { getOrCreateSettings, updateSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { jellyfinService } from '../services/jellyfin';
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
            logger.error('Error fetching settings: {error}', { error });
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
            logger.error('Error updating settings: {error}', { error });
            return c.json({ error: 'Failed to update settings' }, 500);
        }
    })
    .get('/status', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const service = c.req.query('service') as 'sonarr' | 'radarr' | undefined;
            if (service !== 'sonarr' && service !== 'radarr') {
                return c.json({ error: 'Invalid service. Use ?service=sonarr or ?service=radarr' }, 400);
            }

            const settings = await getOrCreateSettings(user.id);

            if (service === 'sonarr') {
                if (!settings?.sonarrUrl || !settings?.sonarrApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await sonarrService.testConnection(settings.sonarrUrl, settings.sonarrApiKey);
                    return c.json<ServiceStatusResponse>(result);
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }

            // radarr
            if (!settings?.radarrUrl || !settings?.radarrApiKey) {
                return c.json<ServiceStatusResponse>({ connected: false });
            }
            try {
                const result = await radarrService.testConnection(settings.radarrUrl, settings.radarrApiKey);
                return c.json<ServiceStatusResponse>(result);
            } catch {
                return c.json<ServiceStatusResponse>({ connected: false });
            }
        } catch (error) {
            logger.error('Error checking service status: {error}', { error });
            return c.json({ error: 'Failed to check service status' }, 500);
        }
    })
    .post('/test-connection', async (c) => {
        try {
            const { type, url, apiKey } = await c.req.json<{
                type: 'sonarr' | 'radarr' | 'jellyfin';
                url: string;
                apiKey: string;
            }>();

            let result: { connected: boolean; version?: string } = { connected: false };
            if (type === 'sonarr') {
                result = await sonarrService.testConnection(url, apiKey);
            } else if (type === 'radarr') {
                result = await radarrService.testConnection(url, apiKey);
            } else if (type === 'jellyfin') {
                result.connected = await jellyfinService.testConnection(url, apiKey);
            }

            // Also return server name/version where available
            if (result.connected && type === 'jellyfin') {
                try {
                    const info = await jellyfinService.getSystemInfo(url, apiKey);
                    return c.json({
                        success: true,
                        serverName: info.ServerName,
                        version: info.Version,
                    });
                } catch {
                    // Fall through to basic success
                }
            }

            return c.json({ success: result.connected, version: result.version });
        } catch (error) {
            logger.error('Error testing connection: {error}', { error });
            return c.json({ success: false, error: 'Connection test failed' });
        }
    });

export default settingsRoute;
