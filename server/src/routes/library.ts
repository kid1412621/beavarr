import { Hono } from 'hono';
import { type LibraryItem } from 'shared';

import { getSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { jellyfinService } from '../services/jellyfin';
import { radarrService } from '../services/radarr';
import { sonarrService } from '../services/sonarr';

const logger = createLogger('library');

const libraryRoute = new Hono<Env>().get('/', async (c) => {
    try {
        logger.info('Fetching library content');
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const settings = await getSettings(user.id);
        const hasJellyfin = !!(
            settings?.jellyfinUrl && settings?.jellyfinApiKey
        );

        // Fetch all sources in parallel
        const [movies, series, jellyfinItems] = await Promise.all([
            radarrService.getMovies(user.id).catch((e) => {
                logger.error('Failed to fetch movies from Radarr: {e}', { e });
                return [];
            }),
            sonarrService.getSeries(user.id).catch((e) => {
                logger.error('Failed to fetch series from Sonarr: {e}', { e });
                return [];
            }),
            hasJellyfin
                ? jellyfinService.getLibrary(user.id).catch((e) => {
                      logger.error(
                          'Failed to fetch library from Jellyfin: {e}',
                          { e },
                      );
                      return [];
                  })
                : Promise.resolve([]),
        ]);

        logger.info('Library fetched', {
            movies: movies.length,
            series: series.length,
            jellyfin: jellyfinItems.length,
        });

        // Transform Radarr movies to unified format
        const libraryMovies: LibraryItem[] = movies.map((m) => {
            let poster_url = null;
            if (m.images) {
                const poster = m.images.find(
                    (img) => img.coverType === 'poster',
                );
                if (poster) poster_url = poster.remoteUrl;
            }
            return {
                type: 'movie' as const,
                title: m.title,
                year: m.year,
                poster_url,
                tmdbId: m.tmdbId,
                radarrId: m.id,
            };
        });

        // Transform Sonarr series to unified format
        const libraryShows: LibraryItem[] = series.map((s) => {
            let poster_url = null;
            if (s.images) {
                const poster = s.images.find(
                    (img) => img.coverType === 'poster',
                );
                if (poster) poster_url = poster.remoteUrl;
            }
            return {
                type: 'show' as const,
                title: s.title,
                year: s.year,
                poster_url,
                tvdbId: s.tvdbId,
                sonarrId: s.id,
            };
        });

        // Deduplicate Jellyfin items against Radarr/Sonarr by type+title+year
        const existingKeys = new Set<string>([
            ...libraryMovies.map(
                (m) => `movie-${m.title.toLowerCase()}-${m.year}`,
            ),
            ...libraryShows.map(
                (s) => `show-${s.title.toLowerCase()}-${s.year}`,
            ),
        ]);

        const uniqueJellyfinItems = jellyfinItems.filter((item) => {
            const key = `${item.type}-${item.title.toLowerCase()}-${item.year}`;
            if (existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
        });

        // Combine and shuffle for a randomized "Library Wall"
        const combined = [
            ...libraryMovies,
            ...libraryShows,
            ...uniqueJellyfinItems,
        ].sort(() => 0.5 - Math.random());

        return c.json<LibraryItem[]>(combined);
    } catch (error) {
        logger.error('Get library error: {error}', { error });
        return c.json({ error: 'Failed to get library' }, 500);
    }
});

export default libraryRoute;
