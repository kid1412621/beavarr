import type { LibraryItem } from 'shared';

import { getSettings } from '../db/repo/settings';
import { createLogger } from '../lib/logger';

const logger = createLogger('jellyfin');

export interface JellyfinSystemInfo {
    ServerName: string;
    Version: string;
    Id: string;
    OperatingSystem: string;
}

export interface JellyfinUser {
    Id: string;
    Name: string;
    ServerId: string;
}

interface JellyfinMediaItem {
    Id: string;
    Name: string;
    Type: 'Movie' | 'Series' | 'Episode' | 'Season' | string;
    ProductionYear?: number;
    ImageTags?: {
        Primary?: string;
        [key: string]: string | undefined;
    };
    BackdropImageTags?: string[];
    UserData?: {
        LastPlayedDate?: string;
        PlayCount?: number;
        Played?: boolean;
    };
    ProviderIds?: {
        Tmdb?: string;
        Tvdb?: string;
        Imdb?: string;
        [key: string]: string | undefined;
    };
    SeriesId?: string;
    SeriesName?: string;
}

interface JellyfinItemsResponse {
    Items: JellyfinMediaItem[];
    TotalRecordCount: number;
}

export class JellyfinService {
    private authHeader(apiKey: string): string {
        return `MediaBrowser Token="${apiKey}", Client="Beavarr", Device="Server", DeviceId="beavarr-server", Version="1.0"`;
    }

    private headers(apiKey: string): Record<string, string> {
        return {
            'X-Emby-Authorization': this.authHeader(apiKey),
            'Content-Type': 'application/json',
        };
    }

    private async getConfig(userId: number): Promise<{
        url: string;
        apiKey: string;
    }> {
        const settings = await getSettings(userId);
        if (!settings?.jellyfinUrl || !settings?.jellyfinApiKey) {
            throw new Error(
                'Jellyfin is not configured. Please set URL and API key in settings.',
            );
        }
        return {
            url: settings.jellyfinUrl.replace(/\/$/, ''),
            apiKey: settings.jellyfinApiKey,
        };
    }

    async testConnection(
        url: string,
        apiKey: string,
    ): Promise<{ connected: boolean; error?: string }> {
        try {
            const cleanUrl = url.replace(/\/$/, '');
            const response = await fetch(`${cleanUrl}/System/Info/Public`, {
                headers: this.headers(apiKey),
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) {
                if (response.status === 401)
                    return { connected: false, error: 'unauthorized' };
                if (response.status === 403)
                    return { connected: false, error: 'forbidden' };
                return { connected: false, error: `status_${response.status}` };
            }
            return { connected: true };
        } catch {
            return { connected: false, error: 'network' };
        }
    }

    async getSystemInfo(
        url: string,
        apiKey: string,
    ): Promise<JellyfinSystemInfo> {
        const cleanUrl = url.replace(/\/$/, '');
        const response = await fetch(`${cleanUrl}/System/Info`, {
            headers: this.headers(apiKey),
        });
        if (!response.ok) {
            throw new Error(
                `Failed to get Jellyfin system info: ${response.statusText}`,
            );
        }
        return (await response.json()) as JellyfinSystemInfo;
    }

    async getCurrentUser(userId: number): Promise<JellyfinUser> {
        const { url, apiKey } = await this.getConfig(userId);

        // API keys are server-level credentials with no user session,
        // so /Users/Me is unavailable. /Users lists all server users instead.
        const response = await fetch(`${url}/Users`, {
            headers: this.headers(apiKey),
        });
        if (!response.ok) {
            throw new Error(
                `Failed to get Jellyfin users: ${response.statusText}`,
            );
        }
        const users = (await response.json()) as Array<{
            Id: string;
            Name: string;
            ServerId: string;
            Policy?: { IsAdministrator?: boolean };
        }>;
        if (!users.length) {
            throw new Error('No users found on Jellyfin server');
        }
        // Prefer the first admin; fall back to whoever is first in the list
        const admin = users.find((u) => u.Policy?.IsAdministrator) ?? users[0]!;
        return { Id: admin.Id, Name: admin.Name, ServerId: admin.ServerId };
    }

    /**
     * Build a poster URL for a Jellyfin item, routed through our proxy.
     * Returns null if no Primary image tag is available.
     */
    private buildPosterUrl(item: JellyfinMediaItem): string | null {
        if (!item.ImageTags?.Primary) return null;
        return `/api/jellyfin/image?itemId=${item.Id}&tag=${item.ImageTags.Primary}`;
    }

    async getLibrary(userId: number): Promise<LibraryItem[]> {
        const { url, apiKey } = await this.getConfig(userId);

        // Resolve the Jellyfin user ID for user-scoped endpoints
        let jellyfinUserId: string;
        try {
            const user = await this.getCurrentUser(userId);
            jellyfinUserId = user.Id;
        } catch (err) {
            logger.error('Failed to get Jellyfin user for library: {err}', {
                err,
            });
            throw err;
        }

        const PAGE_SIZE = 500;

        // Fetches all items of a given type by paginating through the full library.
        const fetchAllOfType = async (
            type: 'Movie' | 'Series',
        ): Promise<JellyfinMediaItem[]> => {
            const all: JellyfinMediaItem[] = [];
            let startIndex = 0;

            while (true) {
                const params = new URLSearchParams({
                    IncludeItemTypes: type,
                    Recursive: 'true',
                    Fields: 'ImageTags,ProviderIds,ProductionYear',
                    Limit: String(PAGE_SIZE),
                    StartIndex: String(startIndex),
                });
                const res = await fetch(
                    `${url}/Users/${jellyfinUserId}/Items?${params.toString()}`,
                    { headers: this.headers(apiKey) },
                );
                if (!res.ok) {
                    logger.error(
                        'Failed to fetch Jellyfin {type} page at {startIndex}: {status}',
                        {
                            type,
                            startIndex,
                            status: res.statusText,
                        },
                    );
                    break;
                }
                const data = (await res.json()) as JellyfinItemsResponse;
                const page = data.Items || [];
                all.push(...page);

                // Stop when we've received all items
                if (
                    all.length >= data.TotalRecordCount ||
                    page.length < PAGE_SIZE
                )
                    break;
                startIndex += PAGE_SIZE;
            }

            return all;
        };

        const [movies, series] = await Promise.all([
            fetchAllOfType('Movie'),
            fetchAllOfType('Series'),
        ]);

        const libraryMovies: LibraryItem[] = movies.map((item) => ({
            type: 'movie' as const,
            title: item.Name || 'Unknown Movie',
            year: item.ProductionYear || 0,
            poster_url: this.buildPosterUrl(item),
            tmdbId: item.ProviderIds?.Tmdb
                ? parseInt(item.ProviderIds.Tmdb, 10) || undefined
                : undefined,
            jellyfinId: item.Id,
        }));

        const libraryShows: LibraryItem[] = series.map((item) => ({
            type: 'show' as const,
            title: item.Name || 'Unknown Show',
            year: item.ProductionYear || 0,
            poster_url: this.buildPosterUrl(item),
            tvdbId: item.ProviderIds?.Tvdb
                ? parseInt(item.ProviderIds.Tvdb, 10) || undefined
                : undefined,
            jellyfinId: item.Id,
        }));

        return [...libraryMovies, ...libraryShows];
    }

    async getHistory(
        userId: number,
        limit: number = 20,
    ): Promise<LibraryItem[]> {
        const { url, apiKey } = await this.getConfig(userId);

        // Resolve the Jellyfin user ID for user-scoped endpoints
        let jellyfinUserId: string;
        try {
            const user = await this.getCurrentUser(userId);
            jellyfinUserId = user.Id;
        } catch (err) {
            logger.error('Failed to get Jellyfin user for history: {err}', {
                err,
            });
            throw err;
        }

        const params = new URLSearchParams({
            IncludeItemTypes: 'Movie,Episode',
            Recursive: 'true',
            Fields: 'ImageTags,ProviderIds,ProductionYear,SeriesName,SeriesId,UserData',
            Filters: 'IsPlayed',
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            Limit: String(limit * 10), // over-fetch to deduplicate shows
        });

        const res = await fetch(
            `${url}/Users/${jellyfinUserId}/Items?${params.toString()}`,
            { headers: this.headers(apiKey) },
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch Jellyfin history: ${res.statusText}`,
            );
        }

        const data = (await res.json()) as JellyfinItemsResponse;
        const items = data.Items || [];

        // Bulk-fetch all unique series in one request to avoid N+1 fetches
        const seriesIds = [
            ...new Set(
                items
                    .filter((item) => item.Type === 'Episode' && item.SeriesId)
                    .map((item) => item.SeriesId!),
            ),
        ];

        const seriesMap = new Map<string, JellyfinMediaItem>();
        if (seriesIds.length > 0) {
            try {
                const seriesParams = new URLSearchParams({
                    Ids: seriesIds.join(','),
                    Fields: 'ImageTags,ProviderIds,ProductionYear',
                });
                const seriesRes = await fetch(
                    `${url}/Items?${seriesParams.toString()}`,
                    { headers: this.headers(apiKey) },
                );
                if (seriesRes.ok) {
                    const seriesData =
                        (await seriesRes.json()) as JellyfinItemsResponse;
                    for (const s of seriesData.Items || []) {
                        seriesMap.set(s.Id, s);
                    }
                }
            } catch (err) {
                logger.error('Failed to bulk fetch series metadata: {err}', {
                    err,
                });
            }
        }

        const seenKeys = new Set<string>();
        const result: LibraryItem[] = [];

        for (const item of items) {
            if (item.Type === 'Movie') {
                const key = `movie-${item.Id}`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);

                result.push({
                    type: 'movie',
                    title: item.Name || 'Unknown Movie',
                    year: item.ProductionYear || 0,
                    poster_url: this.buildPosterUrl(item),
                    tmdbId: item.ProviderIds?.Tmdb
                        ? parseInt(item.ProviderIds.Tmdb, 10) || undefined
                        : undefined,
                    jellyfinId: item.Id,
                });
            } else if (
                item.Type === 'Episode' &&
                item.SeriesId &&
                item.SeriesName
            ) {
                const key = `show-${item.SeriesId}`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);

                const seriesMeta = seriesMap.get(item.SeriesId);
                if (seriesMeta) {
                    result.push({
                        type: 'show',
                        title: item.SeriesName,
                        year: seriesMeta.ProductionYear || 0,
                        poster_url: this.buildPosterUrl(seriesMeta),
                        tvdbId: seriesMeta.ProviderIds?.Tvdb
                            ? parseInt(seriesMeta.ProviderIds.Tvdb, 10) ||
                              undefined
                            : undefined,
                        jellyfinId: item.SeriesId,
                    });
                } else {
                    result.push({
                        type: 'show',
                        title: item.SeriesName,
                        year: item.ProductionYear || 0,
                        poster_url: null,
                        jellyfinId: item.SeriesId,
                    });
                }
            }

            if (result.length >= limit) break;
        }

        return result.slice(0, limit);
    }

    async searchMetadata(
        userId: number,
        query: string,
    ): Promise<JellyfinMediaItem[]> {
        const { url, apiKey } = await this.getConfig(userId);

        // Resolve the Jellyfin user ID for user-scoped endpoints
        let jellyfinUserId: string;
        try {
            const user = await this.getCurrentUser(userId);
            jellyfinUserId = user.Id;
        } catch (err) {
            logger.error('Failed to get Jellyfin user for search: {err}', {
                err,
            });
            throw err;
        }

        const params = new URLSearchParams({
            SearchTerm: query,
            IncludeItemTypes: 'Movie,Series',
            Recursive: 'true',
            Fields: 'ImageTags,ProviderIds,ProductionYear',
            Limit: '10',
        });

        const res = await fetch(
            `${url}/Users/${jellyfinUserId}/Items?${params.toString()}`,
            { headers: this.headers(apiKey) },
        );

        if (!res.ok) {
            throw new Error(`Failed to search Jellyfin: ${res.statusText}`);
        }

        const data = (await res.json()) as JellyfinItemsResponse;
        return data.Items || [];
    }

    /**
     * Proxy a poster image from Jellyfin by item ID.
     * Returns the raw Response so the route can stream it through.
     */
    async fetchImage(
        userId: number,
        itemId: string,
        tag?: string,
    ): Promise<Response> {
        const { url, apiKey } = await this.getConfig(userId);
        const params = new URLSearchParams({ quality: '90' });
        if (tag) params.set('tag', tag);

        return fetch(
            `${url}/Items/${itemId}/Images/Primary?${params.toString()}`,
            { headers: this.headers(apiKey) },
        );
    }
}

export const jellyfinService = new JellyfinService();
