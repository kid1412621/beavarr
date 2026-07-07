const OMDB_API_URL = 'https://www.omdbapi.com/';

export class OMDBService {
    async testConnection(
        apiKey: string,
    ): Promise<{ connected: boolean; error?: string }> {
        try {
            const url = new URL(OMDB_API_URL);
            url.searchParams.set('apikey', apiKey);
            url.searchParams.set('t', 'test'); // request dummy content to test the key

            const res = await fetch(url.toString(), {
                signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) {
                if (res.status === 401)
                    return { connected: false, error: 'unauthorized' };
                if (res.status === 403)
                    return { connected: false, error: 'forbidden' };
                return { connected: false, error: `status_${res.status}` };
            }
            const data = (await res.json()) as {
                Response?: string;
                Error?: string;
            };
            // OMDB returns {"Response":"False","Error":"..."} if the API key is invalid
            if (
                data.Response === 'False' &&
                data.Error === 'Invalid API key!'
            ) {
                return { connected: false, error: 'unauthorized' };
            }
            return { connected: true };
        } catch {
            return { connected: false, error: 'network' };
        }
    }
}

export const omdbService = new OMDBService();
