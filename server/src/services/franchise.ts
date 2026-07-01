import { eq, asc } from 'drizzle-orm';
import type {
    TimelineItem,
    FranchiseTimeline,
    LibraryItem,
    MediaType,
} from 'shared';

import { generateAITimeline } from '../agents/timeline';
import { db } from '../db';
import { getSettings } from '../db/repo/settings';
import { franchises, franchiseItems, movies, shows } from '../db/schema';
import { createLogger } from '../lib/logger';
import { jellyfinService } from './jellyfin';
import { radarrService } from './radarr';
import { sonarrService } from './sonarr';
import { tmdbService } from './tmdb';

const logger = createLogger('franchise-service');

export class FranchiseService {
    async searchFranchise(userId: number, query: string) {
        try {
            const settings = await getSettings(userId);
            const results: Array<{
                id: number;
                name: string;
                posterPath: string | null;
                overview: string;
                type: 'collection' | 'custom';
            }> = [];

            // Priority 1: Search TMDB Collections
            if (settings?.tmdbApiKey) {
                try {
                    const response = await tmdbService.searchCollection(
                        userId,
                        query,
                    );
                    const tmdbResults = response.results.map((c) => ({
                        id: c.id,
                        name: c.name,
                        posterPath: c.poster_path,
                        overview: c.overview || '',
                        type: 'collection' as const,
                    }));
                    results.push(...tmdbResults);
                } catch (err) {
                    logger.error('Failed to search TMDB collections: {error}', {
                        error: err,
                    });
                }
            }

            // Priority 2: Scan local Radarr library to check if any collection names match the search query
            if (settings?.radarrUrl && settings?.radarrApiKey) {
                try {
                    const radarrMovies = await radarrService.getMovies(userId);
                    const localCollections = new Map<
                        number,
                        { id: number; name: string }
                    >();

                    for (const m of radarrMovies) {
                        if (
                            m.collection &&
                            m.collection.tmdbId &&
                            m.collection.name
                        ) {
                            const nameLower = m.collection.name.toLowerCase();
                            const queryLower = query.toLowerCase();
                            if (
                                nameLower.includes(queryLower) &&
                                !localCollections.has(m.collection.tmdbId)
                            ) {
                                localCollections.set(m.collection.tmdbId, {
                                    id: m.collection.tmdbId,
                                    name: m.collection.name,
                                });
                            }
                        }
                    }

                    // Add local collections to results if they are not already present
                    for (const lc of localCollections.values()) {
                        if (!results.some((r) => r.id === lc.id)) {
                            results.push({
                                id: lc.id,
                                name: lc.name,
                                posterPath: null,
                                overview: 'From your Radarr Library',
                                type: 'collection',
                            });
                        }
                    }
                } catch (err) {
                    logger.error(
                        'Failed to query local Radarr library during search: {error}',
                        { error: err },
                    );
                }
            }

            // Always add a custom option for the search query to support mixed media timeline generation
            results.push({
                id: 0,
                name: `Custom Timeline: ${query}`,
                posterPath: null,
                overview: 'Generate a hybrid movie & TV timeline using AI',
                type: 'custom' as const,
            });

            return results;
        } catch (error) {
            logger.error('Failed to search franchises: {error}', { error });
            throw error;
        }
    }

    async getLibrarySuggestedFranchises(userId: number) {
        try {
            const collectionsMap = new Map<
                number | string,
                { id: number; slug: string; name: string; count: number }
            >();

            // 1. If Radarr is configured, get suggestions from Radarr movies
            const settings = await getSettings(userId);
            if (settings?.radarrUrl && settings?.radarrApiKey) {
                try {
                    const radarrMovies = await radarrService.getMovies(userId);
                    for (const m of radarrMovies) {
                        if (
                            m.collection &&
                            m.collection.tmdbId &&
                            m.collection.name
                        ) {
                            const existing = collectionsMap.get(
                                m.collection.tmdbId,
                            );
                            if (existing) {
                                existing.count += 1;
                            } else {
                                collectionsMap.set(m.collection.tmdbId, {
                                    id: m.collection.tmdbId,
                                    slug: `collection-${m.collection.tmdbId}`,
                                    name: m.collection.name,
                                    count: 1,
                                });
                            }
                        }
                    }
                } catch (err) {
                    logger.warn(
                        'Failed to fetch Radarr movies for suggested list: {err}',
                        { err },
                    );
                }
            }

            // 2. Scan locally cached franchises in SQLite (which matches Jellyfin & Sonarr items as they get cached)
            try {
                const dbFranchises = await db.select().from(franchises);
                for (const f of dbFranchises) {
                    const items = await db
                        .select()
                        .from(franchiseItems)
                        .where(eq(franchiseItems.franchiseId, f.id));
                    let localCount = 0;
                    for (const item of items) {
                        if (item.mediaType === 'movie') {
                            const [dbMovie] = await db
                                .select()
                                .from(movies)
                                .where(eq(movies.tmdbId, item.mediaId));
                            if (dbMovie?.inLibrary) {
                                localCount++;
                            }
                        } else if (item.mediaType === 'tv') {
                            const [dbShow] = await db
                                .select()
                                .from(shows)
                                .where(eq(shows.tvdbId, item.mediaId));
                            if (dbShow?.inLibrary) {
                                localCount++;
                            }
                        }
                    }

                    const mapKey = f.slug.startsWith('collection-')
                        ? parseInt(f.slug.replace('collection-', ''), 10)
                        : f.slug;

                    if (
                        typeof mapKey === 'number' &&
                        collectionsMap.has(mapKey)
                    ) {
                        const existing = collectionsMap.get(mapKey)!;
                        if (localCount > existing.count) {
                            existing.count = localCount;
                        }
                    } else if (!collectionsMap.has(f.slug)) {
                        collectionsMap.set(f.slug, {
                            id: typeof mapKey === 'number' ? mapKey : 0,
                            slug: f.slug,
                            name: f.name,
                            count: localCount,
                        });
                    }
                }
            } catch (err) {
                logger.warn(
                    'Failed to fetch cached franchises for suggested list: {err}',
                    { err },
                );
            }

            // 3. Fallback to popular defaults if no matches found
            if (collectionsMap.size === 0) {
                const popularDefaults = [
                    {
                        id: 295,
                        slug: 'collection-295',
                        name: 'Alien Collection',
                        count: 0,
                    },
                    {
                        id: 0,
                        slug: 'Star Wars',
                        name: 'Star Wars (Mixed Timeline)',
                        count: 0,
                    },
                    {
                        id: 0,
                        slug: 'Marvel Cinematic Universe',
                        name: 'Marvel Cinematic Universe',
                        count: 0,
                    },
                    {
                        id: 84,
                        slug: 'collection-84',
                        name: 'Indiana Jones Collection',
                        count: 0,
                    },
                    {
                        id: 1241,
                        slug: 'collection-1241',
                        name: 'Harry Potter Collection',
                        count: 0,
                    },
                ];
                for (const p of popularDefaults) {
                    collectionsMap.set(p.slug, p);
                }
            }

            // Sort and return unified suggestions format
            return Array.from(collectionsMap.values())
                .sort((a, b) => b.count - a.count)
                .map((c) => ({
                    id: c.id,
                    slug: c.slug,
                    name: c.name,
                    overview:
                        c.count > 0
                            ? `${c.count} title(s) in your library`
                            : 'Explore franchise timeline',
                    type: 'collection' as const,
                }));
        } catch (error) {
            logger.error(
                'Failed to get library suggested franchises: {error}',
                { error },
            );
            return [];
        }
    }

    async getFranchiseTimeline(
        userId: number,
        slug: string,
        forceRefresh = false,
    ): Promise<FranchiseTimeline> {
        // Convert slug to clean unique format
        const cleanSlug = slug.toLowerCase().trim();

        // 1. Check cache first
        if (!forceRefresh) {
            const cachedFranchise = await db
                .select()
                .from(franchises)
                .where(eq(franchises.slug, cleanSlug))
                .limit(1);

            const franchise = cachedFranchise[0];
            if (franchise) {
                // Fetch junction items
                const itemsList = await db
                    .select()
                    .from(franchiseItems)
                    .where(eq(franchiseItems.franchiseId, franchise.id))
                    .orderBy(asc(franchiseItems.order));

                const timelineItems: TimelineItem[] = [];

                for (const item of itemsList) {
                    if (item.mediaType === 'movie') {
                        const movieResults = await db
                            .select()
                            .from(movies)
                            .where(eq(movies.tmdbId, item.mediaId))
                            .limit(1);
                        const m = movieResults[0];
                        if (m) {
                            timelineItems.push({
                                mediaId: m.tmdbId,
                                title: m.title,
                                type: 'movie',
                                releaseDate: m.releaseDate ?? undefined,
                                overview: m.overview ?? undefined,
                                posterPath: m.posterPath,
                                radarrId: m.radarrId,
                                jellyfinId: m.jellyfinId,
                                inLibrary: m.inLibrary,
                                libraryStatus: m.libraryStatus ?? undefined,
                                order: item.order,
                                seasonNumber: item.seasonNumber,
                            });
                        }
                    } else if (item.mediaType === 'show') {
                        const showResults = await db
                            .select()
                            .from(shows)
                            .where(eq(shows.tvdbId, item.mediaId))
                            .limit(1);
                        const s = showResults[0];
                        if (s) {
                            timelineItems.push({
                                mediaId: s.tvdbId,
                                title: s.title,
                                type: 'show',
                                releaseDate: s.releaseDate ?? undefined,
                                overview: s.overview ?? undefined,
                                posterPath: s.posterPath,
                                sonarrId: s.sonarrId,
                                jellyfinId: s.jellyfinId,
                                inLibrary: s.inLibrary,
                                libraryStatus: s.libraryStatus ?? undefined,
                                order: item.order,
                                seasonNumber: item.seasonNumber,
                            });
                        }
                    }
                }

                if (timelineItems.length > 0) {
                    // Update the library status dynamically in case they were added/removed since cache
                    const updatedItems = await this.enrichWithLibraryStatus(
                        userId,
                        timelineItems,
                    );
                    return {
                        id: franchise.id,
                        name: franchise.name,
                        slug: franchise.slug,
                        items: updatedItems,
                        updatedAt: franchise.updatedAt
                            ? franchise.updatedAt.toISOString()
                            : new Date().toISOString(),
                    };
                }
            }
        }

        // 2. Cache miss or forceRefresh
        logger.info('Building timeline for slug: {slug}', { slug });
        let name = slug;
        let rawItems: Array<{
            title: string;
            type: MediaType;
            releaseYear?: number;
            mediaId?: number; // tmdbId or tvdbId if already resolved
            seasonNumber?: number;
        }> = [];

        // Check if slug is a collection ID
        const collectionMatch = cleanSlug.match(/^(?:collection-)?(\d+)$/);
        if (collectionMatch) {
            const collectionIdStr = collectionMatch[1];
            if (!collectionIdStr) {
                throw new Error('Failed to parse collection ID');
            }
            const collectionId = parseInt(collectionIdStr, 10);
            const collection = await tmdbService.getCollection(
                userId,
                collectionId,
            );
            name = collection.name;

            // Sort collection parts by release date
            const parts = [...collection.parts].sort((a, b) => {
                const dateA = a.release_date
                    ? new Date(a.release_date).getTime()
                    : 0;
                const dateB = b.release_date
                    ? new Date(b.release_date).getTime()
                    : 0;
                return dateA - dateB;
            });

            rawItems = parts.map((part) => ({
                title: part.title || 'Unknown Title',
                type: 'movie',
                mediaId: part.id,
                releaseYear: part.release_date
                    ? new Date(part.release_date).getFullYear()
                    : undefined,
            }));
        } else {
            // LLM-assisted mixed media timeline generation via agent
            const aiTimeline = await generateAITimeline(userId, slug);
            name = aiTimeline.name;
            rawItems = aiTimeline.items.map((item) => ({
                title: item.title,
                type: item.type,
                releaseYear: item.releaseYear,
                mediaId: item.tmdbId || undefined,
                seasonNumber: item.seasonNumber || undefined,
            }));
        }

        // 3. Resolve metadata and TMDB/TVDB IDs
        const resolvedItems: TimelineItem[] = [];
        let order = 1;

        for (const item of rawItems) {
            try {
                if (item.type === 'movie') {
                    let tmdbId = item.mediaId;
                    let movieDetails: any = null;

                    if (!tmdbId) {
                        // Search TMDB for movie
                        const searchRes = await tmdbService.searchMovie(
                            userId,
                            item.title,
                            item.releaseYear,
                        );
                        const firstRes = searchRes.results[0];
                        if (firstRes) {
                            tmdbId = firstRes.id;
                            movieDetails = firstRes;
                        }
                    } else {
                        // Fetch details directly
                        try {
                            movieDetails = await tmdbService.getMovieDetails(
                                userId,
                                tmdbId,
                            );
                        } catch {
                            // Fallback search
                            const searchRes = await tmdbService.searchMovie(
                                userId,
                                item.title,
                                item.releaseYear,
                            );
                            const firstRes = searchRes.results[0];
                            if (firstRes) {
                                tmdbId = firstRes.id;
                                movieDetails = firstRes;
                            }
                        }
                    }

                    if (tmdbId) {
                        resolvedItems.push({
                            mediaId: tmdbId,
                            title: movieDetails?.title || item.title,
                            type: 'movie',
                            releaseDate:
                                movieDetails?.release_date || undefined,
                            overview: movieDetails?.overview || '',
                            posterPath: movieDetails?.poster_path || null,
                            inLibrary: false,
                            order: order++,
                        });
                    }
                } else if (item.type === 'show') {
                    let tmdbId = item.mediaId; // TMDB ID for TV show details
                    let tvDetails: any = null;
                    let tvdbId: number | null = null;

                    if (!tmdbId) {
                        // Search TMDB for TV show
                        const searchRes = await tmdbService.searchTV(
                            userId,
                            item.title,
                            item.releaseYear,
                        );
                        const firstRes = searchRes.results[0];
                        if (firstRes) {
                            tmdbId = firstRes.id;
                            tvDetails = firstRes;
                        }
                    } else {
                        try {
                            tvDetails = await tmdbService.getTVDetails(
                                userId,
                                tmdbId,
                            );
                        } catch {
                            const searchRes = await tmdbService.searchTV(
                                userId,
                                item.title,
                                item.releaseYear,
                            );
                            const firstRes = searchRes.results[0];
                            if (firstRes) {
                                tmdbId = firstRes.id;
                                tvDetails = firstRes;
                            }
                        }
                    }

                    if (tmdbId) {
                        // Fetch external IDs to resolve tvdbId (required for Sonarr)
                        try {
                            const extIds = await tmdbService.getTVExternalIds(
                                userId,
                                tmdbId,
                            );
                            tvdbId = extIds.tvdb_id || null;
                        } catch (err) {
                            logger.error(
                                'Failed to resolve TVDB ID for show {title}: {error}',
                                { title: item.title, error: err },
                            );
                        }

                        // If TVDB ID is still not found, we use TMDB ID as a fallback, but we will print a warning
                        const finalId = tvdbId || tmdbId;

                        resolvedItems.push({
                            mediaId: finalId,
                            title: tvDetails?.name || item.title,
                            type: 'show',
                            releaseDate: tvDetails?.first_air_date || undefined,
                            overview: tvDetails?.overview || '',
                            posterPath: tvDetails?.poster_path || null,
                            inLibrary: false,
                            order: order++,
                            seasonNumber: item.seasonNumber || null,
                        });
                    }
                }
            } catch (err) {
                logger.error(
                    'Failed to resolve timeline item {title}: {error}',
                    { title: item.title, error: err },
                );
            }
        }

        // 4. Enrich with current Sonarr/Radarr library statuses
        const enrichedItems = await this.enrichWithLibraryStatus(
            userId,
            resolvedItems,
        );

        // 5. Save/Cache in Database
        try {
            await db.transaction(async (tx) => {
                // Upsert franchise header
                let franchiseId: number;
                const existing = await tx
                    .select()
                    .from(franchises)
                    .where(eq(franchises.slug, cleanSlug))
                    .limit(1);

                const firstExisting = existing[0];
                if (firstExisting) {
                    franchiseId = firstExisting.id;
                    await tx
                        .update(franchises)
                        .set({ name, updatedAt: new Date() })
                        .where(eq(franchises.id, franchiseId));
                } else {
                    const inserted = await tx
                        .insert(franchises)
                        .values({ name, slug: cleanSlug })
                        .returning();
                    const firstInserted = inserted[0];
                    if (!firstInserted) {
                        throw new Error('Failed to insert franchise');
                    }
                    franchiseId = firstInserted.id;
                }

                // Delete existing franchise items in cache
                await tx
                    .delete(franchiseItems)
                    .where(eq(franchiseItems.franchiseId, franchiseId));

                // Upsert movies / shows cache tables, and insert junction items
                for (const item of enrichedItems) {
                    if (item.type === 'movie') {
                        await tx
                            .insert(movies)
                            .values({
                                tmdbId: item.mediaId,
                                title: item.title,
                                releaseDate: item.releaseDate || null,
                                overview: item.overview || null,
                                posterPath: item.posterPath || null,
                                radarrId: item.radarrId || null,
                                jellyfinId: item.jellyfinId || null,
                                inLibrary: item.inLibrary,
                                libraryStatus: item.libraryStatus || null,
                            })
                            .onConflictDoUpdate({
                                target: movies.tmdbId,
                                set: {
                                    title: item.title,
                                    releaseDate: item.releaseDate || null,
                                    overview: item.overview || null,
                                    posterPath: item.posterPath || null,
                                    radarrId: item.radarrId || null,
                                    jellyfinId: item.jellyfinId || null,
                                    inLibrary: item.inLibrary,
                                    libraryStatus: item.libraryStatus || null,
                                    updatedAt: new Date(),
                                },
                            });

                        await tx.insert(franchiseItems).values({
                            franchiseId,
                            mediaType: 'movie',
                            mediaId: item.mediaId,
                            order: item.order,
                        });
                    } else if (item.type === 'show') {
                        await tx
                            .insert(shows)
                            .values({
                                tvdbId: item.mediaId,
                                tmdbId: null, // can store if resolved
                                title: item.title,
                                releaseDate: item.releaseDate || null,
                                overview: item.overview || null,
                                posterPath: item.posterPath || null,
                                sonarrId: item.sonarrId || null,
                                jellyfinId: item.jellyfinId || null,
                                inLibrary: item.inLibrary,
                                libraryStatus: item.libraryStatus || null,
                            })
                            .onConflictDoUpdate({
                                target: shows.tvdbId,
                                set: {
                                    title: item.title,
                                    releaseDate: item.releaseDate || null,
                                    overview: item.overview || null,
                                    posterPath: item.posterPath || null,
                                    sonarrId: item.sonarrId || null,
                                    jellyfinId: item.jellyfinId || null,
                                    inLibrary: item.inLibrary,
                                    libraryStatus: item.libraryStatus || null,
                                    updatedAt: new Date(),
                                },
                            });

                        await tx.insert(franchiseItems).values({
                            franchiseId,
                            mediaType: 'show',
                            mediaId: item.mediaId,
                            order: item.order,
                            seasonNumber: item.seasonNumber || null,
                        });
                    }
                }
            });
        } catch (dbErr) {
            logger.error('Failed to cache timeline in database: {error}', {
                error: dbErr,
            });
        }

        return {
            name,
            slug: cleanSlug,
            items: enrichedItems,
            updatedAt: new Date().toISOString(),
        };
    }

    private async enrichWithLibraryStatus(
        userId: number,
        items: TimelineItem[],
    ): Promise<TimelineItem[]> {
        let localMovies: any[] = [];
        let localShows: any[] = [];
        let jellyfinItems: LibraryItem[] = [];

        const settings = await getSettings(userId);

        if (settings?.radarrUrl && settings?.radarrApiKey) {
            try {
                localMovies = await radarrService.getMovies(userId);
            } catch (err) {
                logger.warn(
                    'Failed to fetch local Radarr movies for enrichment: {error}',
                    { error: err },
                );
            }
        }

        if (settings?.sonarrUrl && settings?.sonarrApiKey) {
            try {
                localShows = await sonarrService.getSeries(userId);
            } catch (err) {
                logger.warn(
                    'Failed to fetch local Sonarr series for enrichment: {error}',
                    { error: err },
                );
            }
        }

        if (settings?.jellyfinUrl && settings?.jellyfinApiKey) {
            try {
                jellyfinItems = await jellyfinService.getLibrary(userId);
            } catch (err) {
                logger.warn(
                    'Failed to fetch local Jellyfin items for enrichment: {error}',
                    { error: err },
                );
            }
        }

        // Create lookups
        const movieMap = new Map<number, any>(); // tmdbId -> movie
        for (const m of localMovies) {
            if (m.tmdbId) {
                movieMap.set(m.tmdbId, m);
            }
        }

        const showMap = new Map<number, any>(); // tvdbId -> show
        for (const s of localShows) {
            if (s.tvdbId) {
                showMap.set(s.tvdbId, s);
            }
        }

        const jellyfinMovieMap = new Map<number, LibraryItem>(); // tmdbId -> jellyfin movie
        const jellyfinShowMap = new Map<number, LibraryItem>(); // tvdbId -> jellyfin show
        for (const j of jellyfinItems) {
            if (j.type === 'movie' && j.tmdbId) {
                jellyfinMovieMap.set(j.tmdbId, j);
            } else if (j.type === 'show' && j.tvdbId) {
                jellyfinShowMap.set(j.tvdbId, j);
            }
        }

        return items.map((item) => {
            if (item.type === 'movie') {
                const radarrMovie = movieMap.get(item.mediaId);
                const jMovie = jellyfinMovieMap.get(item.mediaId);
                const jellyfinId = jMovie?.jellyfinId || null;

                if (radarrMovie) {
                    return {
                        ...item,
                        inLibrary: true,
                        radarrId: radarrMovie.id || null,
                        jellyfinId,
                        libraryStatus: radarrMovie.status || 'monitored',
                    };
                } else if (jMovie) {
                    return {
                        ...item,
                        inLibrary: true,
                        radarrId: null,
                        jellyfinId,
                        libraryStatus: 'jellyfin',
                    };
                }
            } else if (item.type === 'show') {
                const sonarrShow = showMap.get(item.mediaId);
                const jShow = jellyfinShowMap.get(item.mediaId);
                const jellyfinId = jShow?.jellyfinId || null;

                if (sonarrShow) {
                    return {
                        ...item,
                        inLibrary: true,
                        sonarrId: sonarrShow.id || null,
                        jellyfinId,
                        libraryStatus: sonarrShow.status || 'monitored',
                    };
                } else if (jShow) {
                    return {
                        ...item,
                        inLibrary: true,
                        sonarrId: null,
                        jellyfinId,
                        libraryStatus: 'jellyfin',
                    };
                }
            }
            return {
                ...item,
                inLibrary: false,
                radarrId: null,
                sonarrId: null,
                jellyfinId: null,
                libraryStatus: 'not_in_library',
            };
        });
    }

    async addTimelineItem(
        userId: number,
        item: { mediaId: number; type: MediaType; title: string },
    ) {
        const settings = await getSettings(userId);

        if (item.type === 'movie') {
            if (!settings?.radarrUrl || !settings?.radarrApiKey) {
                throw new Error(
                    'Radarr is not configured. Please connect Radarr in Settings.',
                );
            }
            // Find movie details to get Title Slug and images
            const searchRes = await radarrService.search(userId, item.title);
            const searchMatch =
                searchRes.find((m) => m.tmdbId === item.mediaId) ||
                searchRes[0];

            if (!searchMatch) {
                throw new Error(
                    `Could not find search result in Radarr for movie: ${item.title}`,
                );
            }

            const payload = {
                tmdbId: item.mediaId,
                title: searchMatch.title || item.title,
                titleSlug: searchMatch.titleSlug,
                images: searchMatch.images || [],
                year: searchMatch.year,
            };

            const result = await radarrService.addMovie(userId, payload);

            // Update local DB cache
            await db
                .update(movies)
                .set({
                    radarrId: result.id || null,
                    inLibrary: true,
                    libraryStatus: result.status || 'monitored',
                })
                .where(eq(movies.tmdbId, item.mediaId));

            return result;
        } else {
            if (!settings?.sonarrUrl || !settings?.sonarrApiKey) {
                throw new Error(
                    'Sonarr is not configured. Please connect Sonarr in Settings.',
                );
            }
            // TV Show - TVDB ID is used
            const searchRes = await sonarrService.search(userId, item.title);
            const searchMatch =
                searchRes.find((s) => s.tvdbId === item.mediaId) ||
                searchRes[0];

            if (!searchMatch) {
                throw new Error(
                    `Could not find search result in Sonarr for show: ${item.title}`,
                );
            }

            const payload = {
                tvdbId: item.mediaId,
                title: searchMatch.title || item.title,
                titleSlug: searchMatch.titleSlug,
                images: searchMatch.images || [],
                seasons: searchMatch.seasons || [],
            };

            const result = await sonarrService.addSeries(userId, payload);

            // Update local DB cache
            await db
                .update(shows)
                .set({
                    sonarrId: result.id || null,
                    inLibrary: true,
                    libraryStatus: result.status || 'monitored',
                })
                .where(eq(shows.tvdbId, item.mediaId));

            return result;
        }
    }
}

export const franchiseService = new FranchiseService();
