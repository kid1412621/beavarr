import { Hono } from 'hono';
import { type JellyfinStatusResponse, type JellyfinUserResponse, type LibraryItem } from 'shared';

import { getSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { jellyfinService } from '../services/jellyfin';

const logger = createLogger('jellyfin');

const jellyfinRoute = new Hono<Env>()
    // Connection status
    .get('/status', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const settings = await getSettings(user.id);
            if (!settings?.jellyfinUrl || !settings?.jellyfinApiKey) {
                return c.json<JellyfinStatusResponse>({ connected: false });
            }

            try {
                const info = await jellyfinService.getSystemInfo(
                    settings.jellyfinUrl,
                    settings.jellyfinApiKey,
                );
                return c.json<JellyfinStatusResponse>({
                    connected: true,
                    serverName: info.ServerName,
                    version: info.Version,
                });
            } catch {
                return c.json<JellyfinStatusResponse>({ connected: false });
            }
        } catch (error) {
            logger.error('Jellyfin status error: {error}', { error });
            return c.json({ error: 'Failed to check Jellyfin status' }, 500);
        }
    })

    // Current user info
    .get('/user', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const jellyfinUser = await jellyfinService.getCurrentUser(user.id);
            return c.json<JellyfinUserResponse>({
                id: jellyfinUser.Id,
                name: jellyfinUser.Name,
                serverId: jellyfinUser.ServerId,
            });
        } catch (error) {
            logger.error('Get Jellyfin user error: {error}', { error });
            return c.json({ error: 'Failed to get Jellyfin user' }, 500);
        }
    })

    // Library (all movies + shows)
    .get('/library', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const items = await jellyfinService.getLibrary(user.id);
            return c.json<LibraryItem[]>(items);
        } catch (error) {
            logger.error('Get Jellyfin library error: {error}', { error });
            return c.json({ error: 'Failed to get Jellyfin library' }, 500);
        }
    })

    // Play history
    .get('/history', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const limitQuery = c.req.query('limit');
            const parsedLimit = limitQuery ? parseInt(limitQuery, 10) : 20;
            const limit = isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit;
            const items = await jellyfinService.getHistory(user.id, limit);
            return c.json<LibraryItem[]>(items);
        } catch (error) {
            logger.error('Get Jellyfin history error: {error}', { error });
            return c.json({ error: 'Failed to get Jellyfin history' }, 500);
        }
    })

    // Image proxy — avoids CORS issues loading posters from self-hosted Jellyfin
    .get('/image', async (c) => {
        const itemId = c.req.query('itemId');
        const tag = c.req.query('tag');

        if (!itemId) {
            return c.json({ error: 'Missing itemId parameter' }, 400);
        }

        const user = c.get('user');
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        try {
            const response = await jellyfinService.fetchImage(user.id, itemId, tag ?? undefined);

            if (!response.ok) {
                return c.json({ error: 'Failed to fetch image from Jellyfin' }, 502);
            }

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            c.header('Content-Type', contentType);
            c.header('Cache-Control', 'public, max-age=86400');

            if (!response.body) {
                return c.json({ error: 'Empty image body from Jellyfin' }, 502);
            }
            return c.body(response.body);
        } catch (error) {
            logger.error('Jellyfin image proxy error: {error}', { error });
            return c.json({ error: 'Failed to proxy Jellyfin image' }, 500);
        }
    });

export default jellyfinRoute;
