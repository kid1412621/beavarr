import { getSettings } from '../db/utils';

export class TraktService {
    private async getCredentials() {
        const settings = await getSettings();
        if (!settings?.traktClientId) {
            throw new Error('Trakt Client ID is not configured');
        }
        return { clientId: settings.traktClientId };
    }

    private headers(clientId: string) {
        return {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': clientId
        }
    }

    async getTrendingMovies() {
        const { clientId } = await this.getCredentials();
        const response = await fetch('https://api.trakt.tv/movies/trending', {
            headers: this.headers(clientId)
        });
        if (!response.ok) throw new Error('Failed to fetch trending movies from Trakt');
        return await response.json();
    }

    async getTrendingShows() {
        const { clientId } = await this.getCredentials();
        const response = await fetch('https://api.trakt.tv/shows/trending', {
            headers: this.headers(clientId)
        });
        if (!response.ok) throw new Error('Failed to fetch trending shows from Trakt');
        return await response.json();
    }
}

export const traktService = new TraktService();
