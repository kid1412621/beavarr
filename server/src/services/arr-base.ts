import { getSettings } from '../db/repo/settings';
import { config } from '../lib/config';

export type ArrSettings = Awaited<ReturnType<typeof getSettings>>;

export abstract class ArrBaseService {
    protected abstract serviceName: string;

    protected abstract getServiceSettings(settings: ArrSettings): {
        url: string | null;
        apiKey: string | null;
    };

    protected async getBaseUrl(userId: number) {
        const settings = await getSettings(userId);
        const { url, apiKey } = this.getServiceSettings(settings);
        if (!url || !apiKey) {
            throw new Error(`${this.serviceName} is not configured`);
        }
        const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        return { url: normalizedUrl, key: apiKey };
    }

    async getSystemStatus(userId: number) {
        const { url, key } = await this.getBaseUrl(userId);
        const response = await fetch(`${url}/api/v3/system/status`, {
            headers: { 'X-Api-Key': key },
            signal: AbortSignal.timeout(config.arrConnectionTimeoutMs),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to get system status from ${this.serviceName}: ${response.status} - ${errorText}`,
            );
        }
        return await response.json();
    }

    async testConnection(
        url: string,
        apiKey: string,
        timeoutMs = config.arrConnectionTimeoutMs,
    ): Promise<{ connected: boolean; version?: string; error?: string }> {
        try {
            const response = await fetch(`${url}/api/v3/system/status`, {
                headers: { 'X-Api-Key': apiKey },
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (!response.ok) {
                if (response.status === 401)
                    return { connected: false, error: 'unauthorized' };
                if (response.status === 403)
                    return { connected: false, error: 'forbidden' };
                return { connected: false, error: `status_${response.status}` };
            }
            const data = (await response.json()) as { version?: string };
            return { connected: true, version: data.version };
        } catch {
            return { connected: false, error: 'network' };
        }
    }
}
