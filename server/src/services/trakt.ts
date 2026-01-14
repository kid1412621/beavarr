import { getSettings } from '../db/utils';
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

export class TraktService {
    private async getValidToken(): Promise<string> {
        const settings = await getSettings();

        if (!settings?.traktAccessToken) {
            throw new Error('Trakt is not connected. Please authenticate with Trakt first.');
        }

        // Check if token needs refresh
        if (traktOAuthService.isTokenExpired(settings.traktTokenExpiresAt ?? null)) {
            if (!settings.traktRefreshToken) {
                throw new Error('Trakt token expired and no refresh token available.');
            }

            // Refresh the token
            const tokens = await traktOAuthService.refreshAccessToken(settings.traktRefreshToken);
            await traktOAuthService.saveTokens(tokens);
            return tokens.access_token;
        }

        return settings.traktAccessToken;
    }

    private headers(accessToken: string) {
        return {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': traktOAuthService.getClientId(),
            'Authorization': `Bearer ${accessToken}`,
        };
    }

    async getTrendingMovies() {
        const accessToken = await this.getValidToken();
        const response = await fetch('https://api.trakt.tv/movies/trending', {
            headers: this.headers(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch trending movies from Trakt: ${response.statusText}`);
        }
        return await response.json();
    }

    async getTrendingShows() {
        const accessToken = await this.getValidToken();
        const response = await fetch('https://api.trakt.tv/shows/trending', {
            headers: this.headers(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch trending shows from Trakt: ${response.statusText}`);
        }
        return await response.json();
    }

    async getUser(): Promise<TraktUser> {
        const accessToken = await this.getValidToken();
        const response = await fetch('https://api.trakt.tv/users/me?extended=full', {
            headers: this.headers(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Trakt user: ${response.statusText}`);
        }
        return await response.json() as Promise<TraktUser>;
    }

    async getWatchlist(type: 'movies' | 'shows' | 'all' = 'all') {
        const accessToken = await this.getValidToken();
        const url = new URL('https://api.trakt.tv/users/me/watchlist');
        if (type !== 'all') {
            url.searchParams.set('type', type);
        }
        url.searchParams.set('extended', 'full');

        const response = await fetch(url.toString(), {
            headers: this.headers(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
        }
        return await response.json();
    }
}

export const traktService = new TraktService();
