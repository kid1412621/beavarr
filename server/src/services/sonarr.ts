import { getSettings } from '../db/utils';

export class SonarrService {
    private async getBaseUrl() {
        const settings = await getSettings();
        if (!settings?.sonarrUrl || !settings?.sonarrApiKey) {
            throw new Error('Sonarr is not configured');
        }
        return { url: settings.sonarrUrl, key: settings.sonarrApiKey };
    }

    async search(term: string) {
        const { url, key } = await this.getBaseUrl();
        const response = await fetch(`${url}/api/v3/series/lookup?term=${encodeURIComponent(term)}`, {
            headers: { 'X-Api-Key': key }
        });
        if (!response.ok) throw new Error('Failed to search Sonarr');
        return await response.json();
    }

    async addSeries(series: any) {
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
                // For a smart agent, we might want to ask user or fetch available paths/profiles first.
                // For now, hardcoding common defaults or minimal payload.
                // Actually, listing root folders and profiles is a prerequisite.
            })
        });
        if (!response.ok) throw new Error('Failed to add series to Sonarr');
        return await response.json();
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
