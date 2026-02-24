import { getSettings, updateSettings } from '../db/repo/settings';
import { createLogger } from '../lib/logger';

const logger = createLogger('trakt-oauth');

const TRAKT_AUTH_URL = 'https://trakt.tv/oauth/authorize';
const TRAKT_TOKEN_URL = 'https://api.trakt.tv/oauth/token';
const TRAKT_DEVICE_CODE_URL = 'https://api.trakt.tv/oauth/device/code';
const TRAKT_DEVICE_TOKEN_URL = 'https://api.trakt.tv/oauth/device/token';
const TRAKT_REVOKE_URL = 'https://api.trakt.tv/oauth/revoke';

// Hardcoded credentials for device flow (public Trakt client for plugins)
const TRAKT_CLIENT_ID =
    process.env.TRAKT_CLIENT_ID ||
    '226e50261eab1d2b7123c9037b58607bfa1acb27dc011355d6fe9d58fda5c435';
const TRAKT_CLIENT_SECRET =
    process.env.TRAKT_CLIENT_SECRET ||
    '71864a3b2ac67154aa714d1aecbb9901de14a590fd86cef8b6c8a1afc4da4803';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    created_at: number;
    scope: string;
    token_type: string;
}

interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_url: string;
    expires_in: number;
    interval: number;
}

export class TraktOAuthService {
    private clientId: string = '';
    private clientSecret: string = '';
    private redirectUri: string;

    constructor() {
        const baseUrl = process.env.CLIENT_URL;
        this.redirectUri = `${baseUrl}/trakt_callback`;
    }

    // Get client ID - from env, settings, or hardcoded
    getClientId(): string {
        return this.clientId || TRAKT_CLIENT_ID;
    }

    // Get client secret - from env, settings, or hardcoded
    getClientSecret(): string {
        return this.clientSecret || TRAKT_CLIENT_SECRET;
    }

    getRedirectUri(): string {
        return this.redirectUri;
    }

    // === Authorization Code Flow (for advanced users with custom credentials) ===

    async getCredentials(userId: number) {
        const settings = await getSettings(userId);
        if (!settings?.traktClientId || !settings?.traktClientSecret) {
            throw new Error('Trakt OAuth credentials not configured');
        }
        this.clientId = settings.traktClientId;
        this.clientSecret = settings.traktClientSecret;
        return { clientId: this.clientId, clientSecret: this.clientSecret };
    }

    getAuthorizationUrl(clientId: string, state: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: this.redirectUri,
            state,
            scope: 'public',
        });
        return `${TRAKT_AUTH_URL}?${params.toString()}`;
    }

    async exchangeCodeForTokens(
        userId: number,
        code: string,
    ): Promise<TokenResponse> {
        await this.getCredentials(userId);

        const response = await fetch(TRAKT_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to exchange code for tokens: ${error}`);
        }

        return (await response.json()) as TokenResponse;
    }

    async refreshAccessToken(
        userId: number,
        refreshToken: string,
    ): Promise<TokenResponse> {
        await this.getCredentials(userId);

        const response = await fetch(TRAKT_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to refresh token: ${error}`);
        }

        return (await response.json()) as TokenResponse;
    }

    // === Device Flow (default for all users) ===
    // https://trakt.docs.apiary.io/#reference/authentication-devices

    async getDeviceCode(): Promise<DeviceCodeResponse> {
        const clientId = this.getClientId();

        const response = await fetch(TRAKT_DEVICE_CODE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get device code: ${error}`);
        }

        return (await response.json()) as DeviceCodeResponse;
    }

    async pollForToken(
        userId: number,
        deviceCode: string,
    ): Promise<TokenResponse | null> {
        const clientId = this.getClientId();
        const clientSecret = this.getClientSecret();

        const response = await fetch(TRAKT_DEVICE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: deviceCode,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'device_code',
            }),
        });

        // 200 - Success, return the tokens
        if (response.ok) {
            return (await response.json()) as TokenResponse;
        }

        const error = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;

        // 400 - Pending, still waiting for user authorization
        if (response.status === 400) {
            return null;
        }

        // 404 - Invalid device_code
        if (response.status === 404) {
            throw new Error('Invalid device code.');
        }

        // 409 - User already approved this code (authorization was successful)
        // The code was consumed, but tokens should already be saved
        if (response.status === 409) {
            // Check if tokens were already saved
            const settings = await getSettings(userId);
            if (settings?.traktAccessToken) {
                return null; // Tokens exist, authorization is complete
            }
            throw new Error(
                'Authorization was completed but tokens not found. Please try again.',
            );
        }

        // 410 - Expired, need to restart the flow
        if (response.status === 410) {
            throw new Error(
                'Device code expired. Please start a new authorization.',
            );
        }

        // 418 - Denied by user
        if (response.status === 418) {
            throw new Error('Authorization was denied.');
        }

        // 429 - Polling too fast
        if (response.status === 429) {
            return null;
        }

        throw new Error(
            `Token poll failed: ${error?.error || 'Unknown error'}`,
        );
    }

    async revokeToken(accessToken: string): Promise<void> {
        const clientId = this.getClientId();
        const clientSecret = this.getClientSecret();

        await fetch(TRAKT_REVOKE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: accessToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        }).catch((err) => {
            logger.error(err, 'Failed to revoke token');
        });
    }

    // === Token Management ===

    async saveTokens(userId: number, tokens: TokenResponse) {
        const expiresAt = new Date(
            (tokens.created_at + tokens.expires_in) * 1000,
        );
        await updateSettings(userId, {
            traktAccessToken: tokens.access_token,
            traktRefreshToken: tokens.refresh_token,
            traktTokenExpiresAt: expiresAt,
        });
    }

    async disconnect(userId: number) {
        const settings = await getSettings(userId);
        if (settings?.traktAccessToken) {
            await this.revokeToken(settings.traktAccessToken);
        }
        await updateSettings(userId, {
            traktAccessToken: null,
            traktRefreshToken: null,
            traktTokenExpiresAt: null,
        });
    }

    isTokenExpired(expiresAt: Date | null): boolean {
        if (!expiresAt) return true;
        // Refresh 5 minutes before expiry
        const bufferMs = 5 * 60 * 1000;
        return new Date(expiresAt.getTime() - bufferMs) < new Date();
    }

    // Check if using custom credentials (advanced mode)
    async isUsingCustomCredentials(userId: number): Promise<boolean> {
        const settings = await getSettings(userId);
        return !!(settings?.traktClientId && settings?.traktClientSecret);
    }
}

export const traktOAuthService = new TraktOAuthService();
