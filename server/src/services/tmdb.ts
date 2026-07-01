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
    private async getApiKey(userId: number) {
        const settings = await getSettings(userId);
        if (!settings?.tmdbApiKey) {
            throw new Error('TMDB API Key is not configured');
        }
        return settings.tmdbApiKey;
    }

    private async request(
        userId: number,
        path: string,
        params: Record<string, string | number | boolean | null | undefined> = {},
    ): Promise<Response> {
        const apiKey = await this.getApiKey(userId);
        const isV4 = apiKey.startsWith('eyJ');

        const url = new URL(`https://api.themoviedb.org/3${path}`);

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        }

        const headers: Record<string, string> = {
            'accept': 'application/json',
        };

        if (isV4) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        } else {
            url.searchParams.set('api_key', apiKey);
        }

        return fetch(url.toString(), { headers });
    }

    async searchMulti(
        userId: number,
        query: string,
    ): Promise<TMDBSearchResponse> {
        const response = await this.request(userId, '/search/multi', { query });
        if (!response.ok) throw new Error('Failed to search TMDB');
        return (await response.json()) as TMDBSearchResponse;
    }

    async getMovieDetails(userId: number, id: number): Promise<TMDBResult> {
        const response = await this.request(userId, `/movie/${id}`);
        if (!response.ok) throw new Error('Failed to get movie details');
        return (await response.json()) as TMDBResult;
    }

    async getTVDetails(userId: number, id: number): Promise<TMDBResult> {
        const response = await this.request(userId, `/tv/${id}`);
        if (!response.ok) throw new Error('Failed to get TV details');
        return (await response.json()) as TMDBResult;
    }

    async searchCollection(
        userId: number,
        query: string,
    ): Promise<{
        results: Array<{
            id: number;
            name: string;
            poster_path: string | null;
            overview: string;
        }>;
    }> {
        const response = await this.request(userId, '/search/collection', { query });
        if (!response.ok)
            throw new Error('Failed to search collections on TMDB');
        return (await response.json()) as any;
    }

    async getCollection(
        userId: number,
        id: number,
    ): Promise<{
        name: string;
        overview: string;
        parts: Array<{
            id: number;
            title: string;
            release_date: string;
            overview: string;
            poster_path: string | null;
        }>;
    }> {
        const response = await this.request(userId, `/collection/${id}`);
        if (!response.ok)
            throw new Error('Failed to get collection details from TMDB');
        return (await response.json()) as any;
    }

    async searchMovie(
        userId: number,
        query: string,
        year?: number | null,
    ): Promise<{
        results: Array<{
            id: number;
            title: string;
            release_date: string;
            overview: string;
            poster_path: string | null;
        }>;
    }> {
        const response = await this.request(userId, '/search/movie', {
            query,
            year: year || undefined,
        });
        if (!response.ok) throw new Error('Failed to search movie on TMDB');
        return (await response.json()) as any;
    }

    async searchTV(
        userId: number,
        query: string,
        year?: number | null,
    ): Promise<{
        results: Array<{
            id: number;
            name: string;
            first_air_date: string;
            overview: string;
            poster_path: string | null;
        }>;
    }> {
        const response = await this.request(userId, '/search/tv', {
            query,
            first_air_date_year: year || undefined,
        });
        if (!response.ok) throw new Error('Failed to search TV on TMDB');
        return (await response.json()) as any;
    }

    async getTVExternalIds(
        userId: number,
        id: number,
    ): Promise<{ tvdb_id: number | null }> {
        const response = await this.request(userId, `/tv/${id}/external_ids`);
        if (!response.ok)
            throw new Error('Failed to get TV external IDs from TMDB');
        return (await response.json()) as any;
    }
}

export const tmdbService = new TMDBService();
