import { getSettings } from '../db/utils';

interface SonarrImage {
    coverType: string;
    url: string;
    remoteUrl: string;
}

export interface SonarrSeries {
    title: string;
    sortTitle: string;
    seasonCount: number;
    status: string;
    overview: string;
    network: string;
    airTime: string;
    images: SonarrImage[];
    seasons: any[];
    year: number;
    path: string;
    profileId: number;
    languageProfileId: number;
    seasonFolder: boolean;
    monitored: boolean;
    useSceneNumbering: boolean;
    runtime: number;
    tvdbId: number;
    tvRageId: number;
    tvMazeId: number;
    firstAired: string;
    seriesType: string;
    cleanTitle: string;
    imdbId: string;
    titleSlug: string;
    certification: string;
    genres: string[];
    tags: any[];
    added: string;
    ratings: {
        votes: number;
        value: number;
    };
    qualityProfileId: number;
    id?: number;
}

export class SonarrService {
    private async getBaseUrl() {
        const settings = await getSettings();
        if (!settings?.sonarrUrl || !settings?.sonarrApiKey) {
            throw new Error('Sonarr is not configured');
        }
        return { url: settings.sonarrUrl, key: settings.sonarrApiKey };
    }

    async search(term: string): Promise<SonarrSeries[]> {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/series/lookup?term=${encodeURIComponent(term)}`, {
            headers: { 'X-Api-Key': key }
        });
        if (!response.ok) throw new Error('Failed to search Sonarr');
        return await response.json() as SonarrSeries[];
    }

    async addSeries(series: Partial<SonarrSeries>): Promise<SonarrSeries> {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/series`, {
            method: 'POST',
            headers: {
                'X-Api-Key': key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...series,
                qualityProfileId: 1, // Default, should probably be configurable or fetched
                languageProfileId: 1,
                monitored: true,
                seasonFolder: true,
                rootFolderPath: '/tv' // Needs to be configured or fetched!
            })
        });
        if (!response.ok) throw new Error('Failed to add series to Sonarr');
        return await response.json() as SonarrSeries;
    }

    async getRootFolders() {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/rootfolder`, {
            headers: { 'X-Api-Key': key }
        });
        if (!response.ok) throw new Error('Failed to get root folders');
        return await response.json();
    }

    async getQualityProfiles() {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/qualityprofile`, {
            headers: { 'X-Api-Key': key }
        });
        if (!response.ok) throw new Error('Failed to get quality profiles');
        return await response.json();
    }
}

export const sonarrService = new SonarrService();
