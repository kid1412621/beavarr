import { getSettings } from '../db/utils';

export class RadarrService {
    private async getBaseUrl() {
        const settings = await getSettings();
        if (!settings?.radarrUrl || !settings?.radarrApiKey) {
            throw new Error('Radarr is not configured');
        }
        return { url: settings.radarrUrl, key: settings.radarrApiKey };
    }

    async search(term: string) {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/movie/lookup?term=${encodeURIComponent(term)}`, {
            headers: { 'X-Api-Key': key }
        });
        if (!response.ok) throw new Error('Failed to search Radarr');
        return await response.json();
    }

    async addMovie(movie: any) {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/movie`, {
            method: 'POST',
            headers: {
                'X-Api-Key': key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...movie,
                qualityProfileId: 1,
                monitored: true,
                rootFolderPath: '/movies' // Placeholder
            })
        });
        if (!response.ok) throw new Error('Failed to add movie to Radarr');
        return await response.json();
    }
}

export const radarrService = new RadarrService();
