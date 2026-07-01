import { Hono } from 'hono';
import type { MediaType } from 'shared';

import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { franchiseService } from '../services/franchise';

const logger = createLogger('franchise-routes');

const franchiseRoute = new Hono<Env>()
    // Search for franchises
    .get('/search', async (c) => {
        try {
            const query = c.req.query('query');
            if (!query) {
                return c.json({ error: 'Query parameter is required' }, 400);
            }

            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const results = await franchiseService.searchFranchise(
                user.id,
                query,
            );
            return c.json(results);
        } catch (error) {
            logger.error('Search franchise error: {error}', { error });
            return c.json({ error: 'Failed to search franchises' }, 500);
        }
    })

    // Get suggested franchises from existing library
    .get('/suggested', async (c) => {
        try {
            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const results =
                await franchiseService.getLibrarySuggestedFranchises(user.id);
            return c.json(results);
        } catch (error) {
            logger.error('Suggested franchises error: {error}', { error });
            return c.json({ error: 'Failed to get suggested franchises' }, 500);
        }
    })

    // Get specific franchise timeline
    .get('/timeline', async (c) => {
        try {
            const slug = c.req.query('slug');
            if (!slug) {
                return c.json({ error: 'Slug parameter is required' }, 400);
            }

            const refresh = c.req.query('refresh') === 'true';
            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const timeline = await franchiseService.getFranchiseTimeline(
                user.id,
                slug,
                refresh,
            );
            return c.json(timeline);
        } catch (error) {
            logger.error('Get franchise timeline error: {error}', { error });
            return c.json(
                { error: 'Failed to retrieve franchise timeline' },
                500,
            );
        }
    })

    // Add timeline item to Sonarr/Radarr library
    .post('/add-item', async (c) => {
        try {
            const body = await c.req.json<{
                mediaId: number;
                type: MediaType;
                title: string;
            }>();
            if (!body || !body.mediaId || !body.type || !body.title) {
                return c.json(
                    { error: 'mediaId, type, and title are required' },
                    400,
                );
            }

            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const result = await franchiseService.addTimelineItem(
                user.id,
                body,
            );
            return c.json({ success: true, result });
        } catch (error: any) {
            logger.error('Add timeline item error: {error}', { error });
            return c.json(
                { error: error.message || 'Failed to add item to library' },
                500,
            );
        }
    });

export default franchiseRoute;
