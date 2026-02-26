import { getSettings } from '../db/repo/settings';

interface RadarrImage {
    coverType: string;
    url: string;
    remoteUrl: string;
}

export interface RadarrMovie {
    title: string;
    originalTitle: string;
    originalLanguage: string;
    alternateTitles: any[];
    secondaryYearSourceId: number;
    sortTitle: string;
    sizeOnDisk: number;
    status: string;
    overview: string;
    inCinemas: string;
    images: RadarrImage[];
    website: string;
    year: number;
    hasFile: boolean;
    digitalRelease: string;
    physicalRelease: string;
    youTubeTrailerId: string;
    studio: string;
    path: string;
    qualityProfileId: number;
    monitored: boolean;
    minimumAvailability: string;
    isAvailable: boolean;
    folderName: string;
    runtime: number;
    cleanTitle: string;
    imdbId: string;
    tmdbId: number;
    titleSlug: string;
    originalTitleSlug: string;
    certification: string;
    genres: string[];
    tags: any[];
    added: string;
    ratings: {
        votes: number;
        value: number;
    };
    collection: {
        name: string;
        tmdbId: number;
        images: any[];
    };
    id?: number;
}

export class RadarrService {
    private async getBaseUrl(userId: number) {
        const settings = await getSettings(userId);
        if (!settings?.radarrUrl || !settings?.radarrApiKey) {
            throw new Error('Radarr is not configured');
        }
        return { url: settings.radarrUrl, key: settings.radarrApiKey };
    }

    async getMovies(userId: number): Promise<RadarrMovie[]> {
        const { url, key } = await this.getBaseUrl(userId);
        const response = await fetch(`${url}/api/v3/movie`, {
            headers: { 'X-Api-Key': key },
        });
        if (!response.ok) throw new Error('Failed to get movies from Radarr');
        return (await response.json()) as RadarrMovie[];
    }

    async search(userId: number, term: string): Promise<RadarrMovie[]> {
        const { url, key } = await this.getBaseUrl(userId);
        const response = await fetch(
            `${url}/api/v3/movie/lookup?term=${encodeURIComponent(term)}`,
            {
                headers: { 'X-Api-Key': key },
            },
        );
        if (!response.ok) throw new Error('Failed to search Radarr');
        return (await response.json()) as RadarrMovie[];
    }

    async addMovie(
        userId: number,
        movie: Partial<RadarrMovie>,
    ): Promise<RadarrMovie> {
        const { url, key } = await this.getBaseUrl(userId);
        const response = await fetch(`${url}/api/v3/movie`, {
            method: 'POST',
            headers: {
                'X-Api-Key': key,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...movie,
                qualityProfileId: 1,
                monitored: true,
                rootFolderPath: '/movies', // Placeholder
            }),
        });
        if (!response.ok) throw new Error('Failed to add movie to Radarr');
        return (await response.json()) as RadarrMovie;
    }

    async getSystemStatus(userId: number) {
        const { url, key } = await this.getBaseUrl(userId);
        const response = await fetch(`${url}/api/v3/system/status`, {
            headers: { 'X-Api-Key': key },
        });
        if (!response.ok)
            throw new Error('Failed to get system status from Radarr');
        return await response.json();
    }

    async testConnection(url: string, apiKey: string) {
        const response = await fetch(`${url}/api/v3/system/status`, {
            headers: { 'X-Api-Key': apiKey },
        });
        if (!response.ok) return false;
        return true;
    }
}

export const radarrService = new RadarrService();
