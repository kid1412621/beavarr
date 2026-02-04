import { getSettings } from '../db/repo/settings';

export interface TMDBResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string; // movie
    name?: string; // tv
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date?: string; // movie
    first_air_date?: string; // tv
    genre_ids: number[];
    popularity: number;
    vote_average: number;
    vote_count: number;
}

export interface TMDBSearchResponse {
    page: number;
    results: TMDBResult[];
    total_results: number;
    total_pages: number;
}

export class TMDBService {
    private async getApiKey() {
        const settings = await getSettings();
        if (!settings?.tmdbApiKey) {
            throw new Error('TMDB API Key is not configured');
        }
        return settings.tmdbApiKey;
    }

    async searchMulti(query: string): Promise<TMDBSearchResponse> {
        const apiKey = await this.getApiKey();
        const response = await fetch(
            `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`,
        );
        if (!response.ok) throw new Error('Failed to search TMDB');
        return (await response.json()) as TMDBSearchResponse;
    }

    async getMovieDetails(id: number): Promise<TMDBResult> {
        const apiKey = await this.getApiKey();
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`,
        );
        if (!response.ok) throw new Error('Failed to get movie details');
        return (await response.json()) as TMDBResult;
    }

    async getTVDetails(id: number): Promise<TMDBResult> {
        const apiKey = await this.getApiKey();
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`,
        );
        if (!response.ok) throw new Error('Failed to get TV details');
        return (await response.json()) as TMDBResult;
    }
}

export const tmdbService = new TMDBService();
