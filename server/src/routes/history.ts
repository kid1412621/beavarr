import { Hono } from 'hono';
import { type LibraryItem } from 'shared';

import { getSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { jellyfinService } from '../services/jellyfin';
import { traktService } from '../services/trakt';

const logger = createLogger('history');

// Helper to safely extract Trakt image
const extractTraktImage = (images: any): string | null => {
    if (!images || !images.poster) return null;

    let url: string | null = null;

    if (images.poster.medium) url = images.poster.medium;
    else if (images.poster.full) url = images.poster.full;
    else if (Array.isArray(images.poster) && images.poster.length > 0) {
        url = images.poster[0];
    }

    if (url && !url.startsWith('http')) {
        return `https://${url}`;
    }

    return url;
};

const historyRoute = new Hono<Env>().get('/', async (c) => {
    try {
        logger.info('Fetching watch history');
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const settings = await getSettings(user.id);
        const hasTrakt = !!settings?.traktAccessToken;
        const hasJellyfin = !!(
            settings?.jellyfinUrl && settings?.jellyfinApiKey
        );

        const limitQuery = c.req.query('limit');
        const parsedLimit = limitQuery ? parseInt(limitQuery, 10) : 100;
        const limit =
            isNaN(parsedLimit) || parsedLimit <= 0
                ? 100
                : Math.min(parsedLimit, 100);

        // Fetch Trakt and Jellyfin histories in parallel
        const [rawTraktHistory, jellyfinHistory] = await Promise.all([
            hasTrakt
                ? traktService.getHistory(user.id, 'all', limit).catch((e) => {
                      logger.error('Failed to fetch history from Trakt: {e}', {
                          e,
                      });
                      return [];
                  })
                : Promise.resolve([]),
            hasJellyfin
                ? jellyfinService.getHistory(user.id, limit).catch((e) => {
                      logger.error(
                          'Failed to fetch history from Jellyfin: {e}',
                          { e },
                      );
                      return [];
                  })
                : Promise.resolve([]),
        ]);

        // Process and map Trakt history
        const seenIds = new Set<string>();
        const uniqueTraktRaw: any[] = [];
        for (const item of rawTraktHistory) {
            const key =
                item.type === 'movie'
                    ? `movie-${item.movie?.ids.trakt}`
                    : `show-${item.show?.ids.trakt}`;
            if (!seenIds.has(key)) {
                seenIds.add(key);
                uniqueTraktRaw.push(item);
            }
        }

        const mappedTraktHistory = (
            await Promise.all(
                uniqueTraktRaw.map(async (item) => {
                    try {
                        let poster_url: string | null = null;
                        let title = '';
                        let year = 0;
                        let tmdbId: number | undefined;
                        let tvdbId: number | undefined;

                        if (item.type === 'movie' && item.movie) {
                            title = item.movie.title || '';
                            year = item.movie.year || 0;
                            poster_url = extractTraktImage(item.movie.images);
                            tmdbId = item.movie.ids.tmdb;
                        } else if (item.type === 'episode' && item.show) {
                            title = item.show.title || '';
                            year = item.show.year || 0;
                            poster_url = extractTraktImage(item.show.images);
                            tvdbId = item.show.ids.tvdb;
                        }

                        if (!title) return null;

                        return {
                            type: item.type === 'episode' ? 'show' : 'movie',
                            title,
                            year,
                            poster_url,
                            tmdbId,
                            tvdbId,
                        } as LibraryItem;
                    } catch (e) {
                        logger.error(
                            'Error enriching Trakt history item: {e}',
                            { e },
                        );
                        return null;
                    }
                }),
            )
        ).filter((item): item is LibraryItem => item !== null);

        // Interleave the two history streams and deduplicate by key
        const combined: LibraryItem[] = [];
        const maxLength = Math.max(
            mappedTraktHistory.length,
            jellyfinHistory.length,
        );
        const seenKeys = new Set<string>();

        const addUnique = (item: LibraryItem) => {
            const key = `${item.type}-${item.title.toLowerCase()}-${item.year}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                combined.push(item);
            }
        };

        for (let i = 0; i < maxLength; i++) {
            const traktItem = mappedTraktHistory[i];
            if (traktItem) {
                addUnique(traktItem);
            }
            const jellyfinItem = jellyfinHistory[i];
            if (jellyfinItem) {
                addUnique(jellyfinItem);
            }
        }

        logger.info('History unified successfully', {
            traktCount: mappedTraktHistory.length,
            jellyfinCount: jellyfinHistory.length,
            combinedCount: combined.length,
        });

        return c.json<LibraryItem[]>(combined.slice(0, limit));
    } catch (error) {
        logger.error('Get unified history error: {error}', { error });
        return c.json({ error: 'Failed to get history' }, 500);
    }
});

export default historyRoute;
