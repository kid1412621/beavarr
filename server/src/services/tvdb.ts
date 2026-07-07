const TVDB_API_URL = 'https://api4.thetvdb.com/v4';

export class TVDBService {
    async testConnection(
        apiKey: string,
    ): Promise<{ connected: boolean; error?: string }> {
        try {
            const res = await fetch(`${TVDB_API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                body: JSON.stringify({ apikey: apiKey }),
                signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) {
                if (res.status === 401)
                    return { connected: false, error: 'unauthorized' };
                if (res.status === 403)
                    return { connected: false, error: 'forbidden' };
                return { connected: false, error: `status_${res.status}` };
            }
            const data = (await res.json()) as { status?: string };
            if (data.status === 'success') {
                return { connected: true };
            }
            return { connected: false, error: 'unauthorized' };
        } catch {
            return { connected: false, error: 'network' };
        }
    }
}

export const tvdbService = new TVDBService();
