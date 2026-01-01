import { getSettings } from '../db/utils';

export class TMDBService {
    private async getApiKey() {
        const settings = await getSettings();
        if (!settings?.tmdbApiKey) {
            throw new Error('TMDB API Key is not configured');
        }
        return settings.tmdbApiKey;
    }

    async searchMulti(query: string) {
        const apiKey = await this.getApiKey();
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search TMDB');
        return await response.json();
    }

    async getMovieDetails(id: number) {
        const apiKey = await this.getApiKey();
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`);
        if (!response.ok) throw new Error('Failed to get movie details');
        return await response.json();
    }

    async getTVDetails(id: number) {
        const apiKey = await this.getApiKey();
        const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`);
        if (!response.ok) throw new Error('Failed to get TV details');
        return await response.json();
    }
}

export const tmdbService = new TMDBService();
