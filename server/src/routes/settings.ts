import { Hono } from 'hono';
import {
    CONNECTABLE_SERVICES,
    type ConnectableService,
    type ServiceStatusResponse,
    type SettingsForm,
} from 'shared';

import { getOrCreateSettings, updateSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { jellyfinService } from '../services/jellyfin';
import { omdbService } from '../services/omdb';
import { radarrService } from '../services/radarr';
import { sonarrService } from '../services/sonarr';
import { tmdbService } from '../services/tmdb';
import { tvdbService } from '../services/tvdb';

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

            const service = c.req.query('service');
            if (
                service !== 'sonarr' &&
                service !== 'radarr' &&
                service !== 'tmdb' &&
                service !== 'tvdb' &&
                service !== 'omdb'
            ) {
                return c.json(
                    {
                        error: 'Invalid service.',
                    },
                    400,
                );
            }

            const settings = await getOrCreateSettings(user.id);

            if (service === 'sonarr') {
                if (!settings?.sonarrUrl || !settings?.sonarrApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await sonarrService.testConnection(
                        settings.sonarrUrl,
                        settings.sonarrApiKey,
                    );
                    return c.json<ServiceStatusResponse>(result);
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }

            if (service === 'radarr') {
                if (!settings?.radarrUrl || !settings?.radarrApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await radarrService.testConnection(
                        settings.radarrUrl,
                        settings.radarrApiKey,
                    );
                    return c.json<ServiceStatusResponse>(result);
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }

            if (service === 'tmdb') {
                if (!settings?.tmdbApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await tmdbService.testConnection(
                        settings.tmdbApiKey,
                    );
                    return c.json<ServiceStatusResponse>({
                        connected: result.connected,
                    });
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }

            if (service === 'tvdb') {
                if (!settings?.tvdbApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await tvdbService.testConnection(
                        settings.tvdbApiKey,
                    );
                    return c.json<ServiceStatusResponse>({
                        connected: result.connected,
                    });
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }

            if (service === 'omdb') {
                if (!settings?.omdbApiKey) {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
                try {
                    const result = await omdbService.testConnection(
                        settings.omdbApiKey,
                    );
                    return c.json<ServiceStatusResponse>({
                        connected: result.connected,
                    });
                } catch {
                    return c.json<ServiceStatusResponse>({ connected: false });
                }
            }
        } catch (error) {
            logger.error('Error checking service status: {error}', { error });
            return c.json({ error: 'Failed to check service status' }, 500);
        }
    })
    .post('/test-connection', async (c) => {
        try {
            const { type, url, apiKey } = await c.req.json<{
                type: ConnectableService;
                url?: string | null;
                apiKey: string;
            }>();

            if (!CONNECTABLE_SERVICES.includes(type)) {
                return c.json(
                    { success: false, error: 'Invalid service type' },
                    400,
                );
            }

            let result: {
                connected: boolean;
                version?: string;
                error?: string;
            } = {
                connected: false,
            };
            if (type === 'sonarr') {
                if (!url) {
                    return c.json(
                        { success: false, error: 'URL required' },
                        400,
                    );
                }
                result = await sonarrService.testConnection(url, apiKey);
            } else if (type === 'radarr') {
                if (!url) {
                    return c.json(
                        { success: false, error: 'URL required' },
                        400,
                    );
                }
                result = await radarrService.testConnection(url, apiKey);
            } else if (type === 'jellyfin') {
                if (!url) {
                    return c.json(
                        { success: false, error: 'URL required' },
                        400,
                    );
                }
                result = await jellyfinService.testConnection(url, apiKey);
            } else if (type === 'tmdb') {
                result = await tmdbService.testConnection(apiKey);
            } else if (type === 'tvdb') {
                result = await tvdbService.testConnection(apiKey);
            } else if (type === 'omdb') {
                result = await omdbService.testConnection(apiKey);
            }

            // Also return server name/version where available
            if (result.connected && type === 'jellyfin') {
                try {
                    const info = await jellyfinService.getSystemInfo(
                        url!,
                        apiKey,
                    );
                    return c.json({
                        success: true,
                        serverName: info.ServerName,
                        version: info.Version,
                    });
                } catch {
                    // Fall through to basic success
                }
            }

            return c.json({
                success: result.connected,
                version: result.version,
                error: result.error,
            });
        } catch (error) {
            logger.error('Error testing connection: {error}', { error });
            return c.json({ success: false, error: 'network' });
        }
    });

export default settingsRoute;
