import type { MediaType } from 'shared';

import { getSettings } from '../db/repo/settings';
import { traktOAuthService } from './trakt_oauth';

interface TraktUser {
    id: number;
    username: string;
    name: string;
    vip: boolean;
    vip_ep: boolean;
    joined_at: string;
    images?: {
        avatar?: {
            full?: string;
        };
    };
}

interface TraktIds {
    trakt: number;
    slug: string;
    imdb?: string;
    tmdb?: number;
    tvdb?: number;
}

export interface TraktImage {
    full: string;
    medium: string;
    thumb: string;
}

export interface TraktMovie {
    title: string;
    year: number;
    ids: TraktIds;
    images?: {
        poster?: TraktImage;
        fanart?: TraktImage;
    };
}

export interface TraktShow {
    title: string;
    year: number;
    ids: TraktIds;
    images?: {
        poster?: TraktImage;
        fanart?: TraktImage;
    };
}

export interface TraktTrendingMovie {
    watchers: number;
    movie: TraktMovie;
}

export interface TraktTrendingShow {
    watchers: number;
    show: TraktShow;
}

export interface TraktWatchlistItem {
    rank: number;
    id: number;
    listed_at: string;
    type: MediaType;
    movie?: TraktMovie;
    show?: TraktShow;
}

export interface TraktHistoryItem {
    id: number;
    watched_at: string;
    action: string;
    type: 'movie' | 'episode';
    movie?: TraktMovie;
    show?: TraktShow;
    episode?: {
        season: number;
        number: number;
        title: string;
        ids: TraktIds;
    };
}

export class TraktService {
    private async getValidToken(userId: number): Promise<string> {
        const settings = await getSettings(userId);

        if (!settings?.traktAccessToken) {
            throw new Error(
                'Trakt is not connected. Please authenticate with Trakt first.',
            );
        }

        // Check if token needs refresh
        if (
            traktOAuthService.isTokenExpired(
                settings.traktTokenExpiresAt ?? null,
            )
        ) {
            if (!settings.traktRefreshToken) {
                throw new Error(
                    'Trakt token expired and no refresh token available.',
                );
            }

            // Refresh the token
            const tokens = await traktOAuthService.refreshAccessToken(
                userId,
                settings.traktRefreshToken,
            );
            await traktOAuthService.saveTokens(userId, tokens);
            return tokens.access_token;
        }

        return settings.traktAccessToken;
    }

    private headers(accessToken: string) {
        return {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': traktOAuthService.getClientId(),
            Authorization: `Bearer ${accessToken}`,
        };
    }

    async getTrendingMovies(userId: number): Promise<TraktTrendingMovie[]> {
        const accessToken = await this.getValidToken(userId);
        const response = await fetch(
            'https://api.trakt.tv/movies/trending?extended=full,images',
            {
                headers: this.headers(accessToken),
            },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch trending movies from Trakt: ${response.statusText}`,
            );
        }
        return (await response.json()) as TraktTrendingMovie[];
    }

    async getTrendingShows(userId: number): Promise<TraktTrendingShow[]> {
        const accessToken = await this.getValidToken(userId);
        const response = await fetch(
            'https://api.trakt.tv/shows/trending?extended=full,images',
            {
                headers: this.headers(accessToken),
            },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch trending shows from Trakt: ${response.statusText}`,
            );
        }
        return (await response.json()) as TraktTrendingShow[];
    }

    async getUser(userId: number): Promise<TraktUser> {
        const accessToken = await this.getValidToken(userId);
        const response = await fetch(
            'https://api.trakt.tv/users/me?extended=full',
            {
                headers: this.headers(accessToken),
            },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch Trakt user: ${response.statusText}`,
            );
        }
        return (await response.json()) as TraktUser;
    }

    async getWatchlist(
        userId: number,
        type: 'movies' | 'shows' | 'all' = 'all',
    ): Promise<TraktWatchlistItem[]> {
        const accessToken = await this.getValidToken(userId);
        const url = new URL('https://api.trakt.tv/users/me/watchlist');
        if (type !== 'all') {
            url.searchParams.set('type', type);
        }
        url.searchParams.set('extended', 'full');

        const response = await fetch(url.toString(), {
            headers: this.headers(accessToken),
        });
        if (!response.ok) {
            throw new Error(
                `Failed to fetch watchlist: ${response.statusText}`,
            );
        }
        return (await response.json()) as TraktWatchlistItem[];
    }

    async getHistory(
        userId: number,
        type: 'movies' | 'shows' | 'all' = 'all',
        limit: number = 20,
    ): Promise<TraktHistoryItem[]> {
        const accessToken = await this.getValidToken(userId);
        const url = new URL('https://api.trakt.tv/users/me/history');
        if (type !== 'all') {
            url.pathname += `/${type}`;
        }

        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('extended', 'full,images');

        const response = await fetch(url.toString(), {
            headers: this.headers(accessToken),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        return (await response.json()) as TraktHistoryItem[];
    }
}

export const traktService = new TraktService();
