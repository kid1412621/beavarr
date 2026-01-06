import { getSettings, updateSettings } from '../db/utils';

const TRAKT_AUTH_URL = 'https://trakt.tv/oauth/authorize';
const TRAKT_TOKEN_URL = 'https://api.trakt.tv/oauth/token';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    created_at: number;
    scope: string;
    token_type: string;
}

export class TraktOAuthService {
    private clientId: string = '';
    private clientSecret: string = '';
    private redirectUri: string;

    constructor() {
        // Use the full redirect URI directly - client handles the callback
        const baseUrl = process.env.CLIENT_URL;
        this.redirectUri = `${baseUrl}/trakt_callback`;
    }

    getRedirectUri(): string {
        return this.redirectUri;
    }

    async getCredentials() {
        const settings = await getSettings();
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

    async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
        await this.getCredentials();

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

    async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        await this.getCredentials();

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

    async saveTokens(tokens: TokenResponse) {
        const expiresAt = new Date((tokens.created_at + tokens.expires_in) * 1000);
        await updateSettings({
            traktAccessToken: tokens.access_token,
            traktRefreshToken: tokens.refresh_token,
            traktTokenExpiresAt: expiresAt,
        });
    }

    async disconnect() {
        await updateSettings({
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
}

export const traktOAuthService = new TraktOAuthService();
