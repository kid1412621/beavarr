import { DynamicStructuredTool } from '@langchain/core/tools';
import { MEDIA_TYPES, type MediaType } from 'shared';
import { z } from 'zod';

import { createLogger } from '../lib/logger';
import { franchiseService } from '../services/franchise';
import { jellyfinService } from '../services/jellyfin';
import { radarrService } from '../services/radarr';
import { sonarrService } from '../services/sonarr';
import { tmdbService } from '../services/tmdb';
import { traktService } from '../services/trakt';

const logger = createLogger('tools');

export const createSonarrSearchTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'sonarr_search',
        description: 'Search for TV shows in Sonarr to find titles to add.',
        schema: z.object({
            term: z.string().describe("The search term (e.g., 'Breaking Bad')"),
        }),
        func: async ({ term }: { term: string }) => {
            try {
                const results = await sonarrService.search(userId, term);
                return JSON.stringify(results.slice(0, 5)); // Limit to 5 results
            } catch (error) {
                return `Error searching Sonarr: ${error}`;
            }
        },
    });

export const createSonarrAddTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'sonarr_add',
        description:
            'Add a TV show to Sonarr library. You MUST search first to get the correct TVDB ID.',
        schema: z.object({
            tvdbId: z.number().describe('The TVDB ID of the show to add'),
            title: z.string().describe('The title of the show'),
            titleSlug: z.string().describe('The slug of the title'),
            images: z
                .array(z.any())
                .optional()
                .describe('Images array from search result'),
            seasons: z
                .array(z.any())
                .optional()
                .describe('Seasons array from search result'),
        }),
        func: async (seriesData: {
            tvdbId: number;
            title: string;
            titleSlug: string;
            images?: any[];
            seasons?: any[];
        }) => {
            try {
                const payload = {
                    tvdbId: seriesData.tvdbId,
                    title: seriesData.title,
                    titleSlug: seriesData.titleSlug,
                    images: seriesData.images || [],
                    seasons: seriesData.seasons || [],
                    // defaults handled in service
                };
                const result = await sonarrService.addSeries(userId, payload);
                return JSON.stringify(result);
            } catch (error) {
                return `Error adding to Sonarr: ${error}`;
            }
        },
    });

export const createRadarrSearchTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'radarr_search',
        description: 'Search for movies in Radarr.',
        schema: z.object({
            term: z.string().describe("The search term (e.g., 'Inception')"),
        }),
        func: async ({ term }: { term: string }) => {
            try {
                const results = await radarrService.search(userId, term);
                return JSON.stringify(results.slice(0, 5));
            } catch (error) {
                return `Error searching Radarr: ${error}`;
            }
        },
    });

export const createRadarrAddTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'radarr_add',
        description:
            'Add a movie to Radarr library. You MUST search first to get the TMDB ID.',
        schema: z.object({
            tmdbId: z.number().describe('The TMDB ID of the movie'),
            title: z.string().describe('The title of the movie'),
            titleSlug: z.string().describe('The slug of the title'),
            images: z.array(z.any()).optional(),
            year: z.number().optional(),
        }),
        func: async (movieData: {
            tmdbId: number;
            title: string;
            titleSlug: string;
            images?: any[];
            year?: number;
        }) => {
            try {
                // Reconstruct payload
                // Radarr needs 'tmdbId', 'title', 'year', 'images' etc.
                const payload = {
                    tmdbId: movieData.tmdbId,
                    title: movieData.title,
                    titleSlug: movieData.titleSlug,
                    identifiers: { tmdbId: movieData.tmdbId }, // sometimes needed?
                    images: movieData.images || [],
                    year: movieData.year,
                };
                const result = await radarrService.addMovie(userId, payload);
                return JSON.stringify(result);
            } catch (error) {
                return `Error adding to Radarr: ${error}`;
            }
        },
    });

export const createTraktTrendingTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'trakt_trending',
        description: 'Get trending movies or shows from Trakt.',
        schema: z.object({
            type: z
                .enum(['movies', 'shows'])
                .describe('The type of content to fetch'),
        }),
        func: async ({ type }: { type: 'movies' | 'shows' }) => {
            try {
                if (type === 'movies') {
                    const results =
                        await traktService.getTrendingMovies(userId);
                    return JSON.stringify(results.slice(0, 10));
                } else {
                    const results = await traktService.getTrendingShows(userId);
                    return JSON.stringify(results.slice(0, 10));
                }
            } catch (error) {
                logger.error('failed to call trakt: {error}', { error });
                return `Error fetching trending from Trakt: ${error}`;
            }
        },
    });

export const createTraktWatchlistTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'trakt_watchlist',
        description:
            "Get the authenticated user's Trakt watchlist. Shows movies and/or TV shows the user wants to watch.",
        schema: z.object({
            type: z
                .enum(['movies', 'shows', 'all'])
                .optional()
                .default('all')
                .describe('Type of content to fetch'),
        }),
        func: async ({ type }: { type: 'movies' | 'shows' | 'all' }) => {
            try {
                const results = await traktService.getWatchlist(userId, type);
                return JSON.stringify(results.slice(0, 20));
            } catch (error) {
                logger.error('failed to call trakt watchlist: {error}', {
                    error,
                });
                return `Error fetching watchlist from Trakt: ${error}`;
            }
        },
    });

export const createTmdbSearchTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'tmdb_search',
        description:
            'Search for metadata about movies or TV shows on TMDB to get details like cast, plot, etc.',
        schema: z.object({
            query: z.string().describe('Search query'),
        }),
        func: async ({ query }: { query: string }) => {
            try {
                const results = await tmdbService.searchMulti(userId, query);
                return JSON.stringify(results.results.slice(0, 5));
            } catch (error) {
                return `Error searching TMDB: ${error}`;
            }
        },
    });

export const createSonarrListTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'sonarr_list',
        description:
            'List TV shows currently in the Sonarr library. Use the limit parameter to avoid returning the entire library at once — the Sonarr API has no server-side pagination so all items are always fetched and sliced in memory.',
        schema: z.object({
            limit: z
                .number()
                .int()
                .positive()
                .optional()
                .describe(
                    'Maximum number of shows to return. Omit to return all (not recommended for large libraries).',
                ),
        }),
        func: async ({ limit }: { limit?: number }) => {
            try {
                const results = await sonarrService.getSeries(userId);
                const mapped = results.map((s) => ({
                    title: s.title,
                    status: s.status,
                    year: s.year,
                    tvdbId: s.tvdbId,
                }));
                return JSON.stringify(
                    limit !== undefined ? mapped.slice(0, limit) : mapped,
                );
            } catch (error) {
                logger.error('failed to call sonarr list: {error}', { error });
                return `Error listing Sonarr series: ${error}`;
            }
        },
    });

export const createRadarrListTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'radarr_list',
        description:
            'List movies currently in the Radarr library. Use the limit parameter to avoid returning the entire library at once — the Radarr API has no server-side pagination so all items are always fetched and sliced in memory.',
        schema: z.object({
            limit: z
                .number()
                .int()
                .positive()
                .optional()
                .describe(
                    'Maximum number of movies to return. Omit to return all (not recommended for large libraries).',
                ),
        }),
        func: async ({ limit }: { limit?: number }) => {
            try {
                const results = await radarrService.getMovies(userId);
                const mapped = results.map((m) => ({
                    title: m.title,
                    status: m.status,
                    year: m.year,
                    tmdbId: m.tmdbId,
                }));
                return JSON.stringify(
                    limit !== undefined ? mapped.slice(0, limit) : mapped,
                );
            } catch (error) {
                logger.error('failed to call radarr list: {error}', { error });
                return `Error listing Radarr movies: ${error}`;
            }
        },
    });

export const createJellyfinLibraryTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'jellyfin_library',
        description:
            "List movies and TV shows in the user's Jellyfin media server library.",
        schema: z.object({
            limit: z
                .number()
                .int()
                .positive()
                .optional()
                .describe('Maximum number of items to return.'),
        }),
        func: async ({ limit }: { limit?: number }) => {
            try {
                const items = await jellyfinService.getLibrary(userId);
                const mapped = items.map((i) => ({
                    type: i.type,
                    title: i.title,
                    year: i.year,
                    jellyfinId: i.jellyfinId,
                    tmdbId: i.tmdbId,
                    tvdbId: i.tvdbId,
                }));
                return JSON.stringify(
                    limit !== undefined ? mapped.slice(0, limit) : mapped,
                );
            } catch (error) {
                logger.error('failed to call jellyfin library: {error}', {
                    error,
                });
                return `Error listing Jellyfin library: ${error}`;
            }
        },
    });

export const createJellyfinHistoryTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'jellyfin_history',
        description:
            "Get the user's recently played movies and TV shows from Jellyfin.",
        schema: z.object({
            limit: z
                .number()
                .int()
                .positive()
                .optional()
                .default(20)
                .describe('Number of recent items to return (default 20).'),
        }),
        func: async ({ limit }: { limit?: number }) => {
            try {
                const items = await jellyfinService.getHistory(
                    userId,
                    limit ?? 20,
                );
                return JSON.stringify(
                    items.map((i) => ({
                        type: i.type,
                        title: i.title,
                        year: i.year,
                    })),
                );
            } catch (error) {
                logger.error('failed to call jellyfin history: {error}', {
                    error,
                });
                return `Error fetching Jellyfin history: ${error}`;
            }
        },
    });

export const createJellyfinSearchTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'jellyfin_search',
        description:
            "Search for movies or TV shows in the user's Jellyfin media server by title.",
        schema: z.object({
            query: z.string().describe('Title to search for'),
        }),
        func: async ({ query }: { query: string }) => {
            try {
                const results = await jellyfinService.searchMetadata(
                    userId,
                    query,
                );
                return JSON.stringify(
                    results.slice(0, 10).map((r) => ({
                        title: r.Name,
                        type: r.Type,
                        year: r.ProductionYear,
                        jellyfinId: r.Id,
                    })),
                );
            } catch (error) {
                logger.error('failed to call jellyfin search: {error}', {
                    error,
                });
                return `Error searching Jellyfin: ${error}`;
            }
        },
    });

export const createFranchiseTimelineTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'get_franchise_timeline',
        description:
            "Get a chronological timeline of movies and TV shows in a franchise (e.g. Star Wars, Alien, Marvel, Indiana Jones, etc.). It resolves all titles, details, and tracks if they are present in the user's local library (Radarr, Sonarr, Jellyfin). Returns the list of titles.",
        schema: z.object({
            slug: z
                .string()
                .describe(
                    'The name or identifier of the franchise to lookup (e.g. "Alien" or a TMDB collection slug like "collection-80")',
                ),
            refresh: z
                .boolean()
                .optional()
                .default(false)
                .describe(
                    'Set to true to force refresh the timeline metadata and sync from external APIs',
                ),
        }),
        func: async ({
            slug,
            refresh,
        }: {
            slug: string;
            refresh?: boolean;
        }) => {
            try {
                const timeline = await franchiseService.getFranchiseTimeline(
                    userId,
                    slug,
                    refresh,
                );
                return JSON.stringify({
                    name: timeline.name,
                    slug: timeline.slug,
                    updatedAt: timeline.updatedAt,
                    items: timeline.items.map((i) => ({
                        order: i.order,
                        title: i.title,
                        type: i.type,
                        releaseYear: i.releaseDate
                            ? new Date(i.releaseDate).getFullYear()
                            : null,
                        inLibrary: i.inLibrary,
                        radarrId: i.radarrId,
                        sonarrId: i.sonarrId,
                        jellyfinId: i.jellyfinId,
                        libraryStatus: i.libraryStatus,
                        seasonNumber: i.seasonNumber,
                    })),
                });
            } catch (error) {
                logger.error('failed to call get franchise timeline: {error}', {
                    error,
                });
                return `Error fetching franchise timeline: ${error}`;
            }
        },
    });

export const createFranchiseAddMissingTool = (userId: number) =>
    new DynamicStructuredTool({
        name: 'add_franchise_missing_titles',
        description:
            "Batch add missing movies or TV shows from a franchise timeline into the user's libraries (Radarr for movies, Sonarr for TV shows) so they can start downloading.",
        schema: z.object({
            items: z
                .array(
                    z.object({
                        mediaId: z
                            .number()
                            .int()
                            .describe(
                                'The database primary key / TMDB ID (movies) or TVDB ID (TV shows) of the item',
                            ),
                        type: z
                            .enum(MEDIA_TYPES)
                            .describe('Type of media: movie or show'),
                        title: z.string().describe('Title of the media'),
                    }),
                )
                .describe('List of items to add'),
        }),
        func: async ({
            items,
        }: {
            items: { mediaId: number; type: MediaType; title: string }[];
        }) => {
            const added: string[] = [];
            const failed: string[] = [];
            for (const item of items) {
                try {
                    await franchiseService.addTimelineItem(userId, item);
                    added.push(item.title);
                } catch (error: any) {
                    logger.error(
                        'failed to add franchise item {title}: {error}',
                        { title: item.title, error },
                    );
                    failed.push(`${item.title} (${error.message || error})`);
                }
            }
            return JSON.stringify({
                success: true,
                added,
                failed,
            });
        },
    });
