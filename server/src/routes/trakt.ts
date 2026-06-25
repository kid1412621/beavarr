import { randomUUID } from 'crypto';

import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import {
    type TraktAuthRequest,
    type TraktStatusResponse,
    type TraktUserResponse,
    type TraktDeviceCodeResponse,
    type TraktPollResponse,
    type LibraryItem,
} from 'shared';

import { getSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';
import { traktService } from '../services/trakt';
import { traktOAuthService } from '../services/trakt_oauth';

const logger = createLogger('trakt');

// Helper to safely extract Trakt image
const extractTraktImage = (images: any): string | null => {
    if (!images || !images.poster) return null;

    let url: string | null = null;

    // Case 1: Standard API (Object with sizes)
    if (images.poster.medium) url = images.poster.medium;
    else if (images.poster.full) url = images.poster.full;

    // Case 2: Array format (User reported)
    else if (Array.isArray(images.poster) && images.poster.length > 0) {
        url = images.poster[0];
    }

    if (url && !url.startsWith('http')) {
        return `https://${url}`;
    }

    return url;
};

const traktRoute = new Hono<Env>()
    // Get authorization URL for Trakt OAuth
    .get('/auth-url', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const settings = await getSettings(user.id);
            if (!settings?.traktClientId || !settings?.traktClientSecret) {
                return c.json(
                    { error: 'Trakt client credentials not configured' },
                    400,
                );
            }

            // Generate state for CSRF protection
            const state = randomUUID();

            // Store state in a cookie for validation on callback
            setCookie(c, 'trakt_oauth_state', state, {
                httpOnly: true,
                sameSite: 'Lax',
                path: '/',
                maxAge: 600,
                secure: process.env.NODE_ENV === 'production',
            });

            const authUrl = traktOAuthService.getAuthorizationUrl(
                settings.traktClientId!,
                state,
            );
            const redirectUri = traktOAuthService.getRedirectUri();
            logger.info('Trakt OAuth redirect URI', { redirectUri });
            return c.json({ authUrl, state });
        } catch (error) {
            logger.error('Error generating auth URL: {error}', { error });
            return c.json(
                { error: 'Failed to generate authorization URL' },
                500,
            );
        }
    })
    // OAuth callback - exchange code for tokens
    // This endpoint handles the redirect from Trakt after user authorization
    .get('/callback', async (c) => {
        const code = c.req.query('code');
        const state = c.req.query('state');
        const error = c.req.query('error');

        // Handle OAuth errors from Trakt
        if (error) {
            return c.json({ error: `Authorization failed: ${error}` }, 400);
        }

        if (!code || !state) {
            return c.json(
                {
                    error: 'Authorization code or state is missing from the callback',
                },
                400,
            );
        }

        try {
            // Get state from cookie
            const storedState = getCookie(c, 'trakt_oauth_state');

            if (state !== storedState) {
                return c.json(
                    {
                        error: 'Invalid state parameter. Please try connecting again',
                    },
                    400,
                );
            }

            // Clear state cookie
            deleteCookie(c, 'trakt_oauth_state', {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            });

            // Exchange code for tokens
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const tokens = await traktOAuthService.exchangeCodeForTokens(
                user.id,
                code,
            );

            // Save tokens
            await traktOAuthService.saveTokens(user.id, tokens);

            return c.json({
                success: true,
                message: 'Successfully connected to Trakt',
            });
        } catch (err) {
            logger.error('OAuth callback error: {err}', { err });
            return c.json(
                {
                    error: 'Failed to connect Trakt. Please try again.',
                    details:
                        err instanceof Error ? err.message : 'Unknown error',
                },
                500,
            );
        }
    })
    // Refresh access token
    .post('/refresh', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const settings = await getSettings(user.id);
            if (!settings?.traktRefreshToken) {
                return c.json({ error: 'No refresh token available' }, 400);
            }

            const tokens = await traktOAuthService.refreshAccessToken(
                user.id,
                settings.traktRefreshToken,
            );
            await traktOAuthService.saveTokens(user.id, tokens);

            return c.json({ success: true });
        } catch (error) {
            logger.error('Token refresh error: {error}', { error });
            return c.json({ error: 'Failed to refresh token' }, 500);
        }
    })
    // Disconnect Trakt
    .delete('/disconnect', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            await traktOAuthService.disconnect(user.id);
            return c.json({ success: true });
        } catch (error) {
            logger.error('Disconnect error: {error}', { error });
            return c.json({ error: 'Failed to disconnect' }, 500);
        }
    })
    // === Device Flow Endpoints ===
    // Start device authorization flow
    .post('/device/code', async (c) => {
        try {
            const deviceCode = await traktOAuthService.getDeviceCode();
            return c.json<TraktDeviceCodeResponse>({
                device_code: deviceCode.device_code,
                user_code: deviceCode.user_code,
                verification_url: deviceCode.verification_url,
                expires_in: deviceCode.expires_in,
                interval: deviceCode.interval,
            });
        } catch (error) {
            logger.error('Device code error: {error}', { error });
            return c.json(
                { error: 'Failed to start device authorization' },
                500,
            );
        }
    })
    // Poll for device authorization completion
    .post('/device/poll', async (c) => {
        try {
            const { device_code } = await c.req.json<TraktAuthRequest>();

            if (!device_code) {
                return c.json({ error: 'device_code required' }, 400);
            }

            const userContext = c.get('user');
            if (!userContext) return c.json({ error: 'Unauthorized' }, 401);

            const tokens = await traktOAuthService.pollForToken(
                userContext.id,
                device_code,
            );

            if (tokens === null) {
                // Still waiting for user authorization
                return c.json<TraktPollResponse>({ status: 'pending' });
            }

            // Authorization successful, save tokens
            await traktOAuthService.saveTokens(userContext.id, tokens);

            // Get user info
            const user = await traktService.getUser(userContext.id);

            return c.json<TraktPollResponse>({
                status: 'authorized',
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                },
            });
        } catch (error) {
            logger.error('Device poll error: {error}', { error });
            return c.json({ error: 'Failed to poll for authorization' }, 500);
        }
    })
    // Disconnect using device flow (with token revocation)
    .delete('/device', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            await traktOAuthService.disconnect(user.id);
            return c.json({ success: true });
        } catch (error) {
            logger.error('Device disconnect error: {error}', { error });
            return c.json({ error: 'Failed to disconnect' }, 500);
        }
    })
    // Check if using custom credentials (advanced mode)
    .get('/auth-mode', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const isCustom = await traktOAuthService.isUsingCustomCredentials(
                user.id,
            );
            return c.json({
                mode: isCustom ? 'authorization_code' : 'device',
            });
        } catch (error) {
            logger.error('Auth mode check error: {error}', { error });
            return c.json({ error: 'Failed to check auth mode' }, 500);
        }
    })

    // Get Trakt connection status
    .get('/status', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const settings = await getSettings(user.id);
            const isConnected = !!settings?.traktAccessToken;
            const isExpired = traktOAuthService.isTokenExpired(
                settings?.traktTokenExpiresAt ?? null,
            );

            return c.json<TraktStatusResponse>({
                connected: isConnected,
                hasValidToken: isConnected && !isExpired,
                needsTokenRefresh: isConnected && isExpired,
            });
        } catch (error) {
            logger.error('Status check error: {error}', { error });
            return c.json({ error: 'Failed to check status' }, 500);
        }
    })
    // Get authenticated Trakt user profile
    .get('/user', async (c) => {
        try {
            const userContext = c.get('user');
            if (!userContext) return c.json({ error: 'Unauthorized' }, 401);
            const user = await traktService.getUser(userContext.id);
            return c.json<TraktUserResponse>({
                id: user.id,
                username: user.username,
                name: user.name,
                vip: user.vip,
                vip_ep: user.vip_ep,
                avatar: user.images?.avatar?.full || null,
                joined: user.joined_at,
            });
        } catch (error) {
            logger.error('Get user error: {error}', { error });
            return c.json({ error: 'Failed to get user' }, 500);
        }
    })
    // Proxy avatar image through server to avoid CORS issues
    .get('/avatar', async (c) => {
        const avatarUrl = c.req.query('url');
        if (!avatarUrl) {
            return c.json({ error: 'Missing url parameter' }, 400);
        }

        try {
            const response = await fetch(avatarUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Beavarr/1.0)',
                },
            });

            if (!response.ok) {
                return c.json({ error: 'Failed to fetch avatar' }, 500);
            }

            const contentType =
                response.headers.get('content-type') || 'image/jpeg';
            c.header('Content-Type', contentType);
            c.header('Cache-Control', 'public, max-age=3600');

            const arrayBuffer = await response.arrayBuffer();
            return c.body(arrayBuffer);
        } catch (error) {
            logger.error('Avatar proxy error: {error}', { error });
            return c.json({ error: 'Failed to fetch avatar' }, 500);
        }
    })
    // Get Trakt watchlist
    .get('/watchlist', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);
            const type =
                (c.req.query('type') as 'movies' | 'shows' | 'all') || 'all';
            const watchlist = await traktService.getWatchlist(user.id, type);
            return c.json(watchlist);
        } catch (error) {
            logger.error('Get watchlist error: {error}', { error });
            return c.json({ error: 'Failed to get watchlist' }, 500);
        }
    })
    // Get Trakt history with posters
    .get('/history', async (c) => {
        try {
            const requestedLimit = parseInt(c.req.query('limit') || '20');
            // Fetch significantly more items upstream to ensure we have enough unique items after deduplication
            // (e.g. if user watched 20 episodes of one show, we need to fetch past those to find the next show)
            const fetchLimit = Math.min(requestedLimit * 10, 200);

            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            const rawHistory = await traktService.getHistory(
                user.id,
                'all',
                fetchLimit,
            );
            logger.info('Trakt history fetched', { count: rawHistory.length });

            // Deduplicate: Keep only the first occurrence (most recent) of each show/movie
            const seenIds = new Set<string>();
            // TODO: save in db
            const history: typeof rawHistory = [];

            for (const item of rawHistory) {
                const key =
                    item.type === 'movie'
                        ? `movie-${item.movie?.ids.trakt}`
                        : `show-${item.show?.ids.trakt}`;

                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    history.push(item);
                }
            }

            // Enrich with posters
            const enrichedHistory = await Promise.all(
                history.map(async (item, _) => {
                    try {
                        let poster_url: string | null = null;
                        let title = '';
                        let year = 0;
                        let tmdbId: number | undefined;
                        let tvdbId: number | undefined;

                        if (item.type === 'movie' && item.movie) {
                            title = item.movie.title || '';
                            year = item.movie.year || 0;
                            poster_url = extractTraktImage(item.movie.images);
                            tmdbId = item.movie.ids.tmdb;
                        } else if (item.type === 'episode' && item.show) {
                            title = item.show.title || '';
                            year = item.show.year || 0;
                            poster_url = extractTraktImage(item.show.images);
                            tvdbId = item.show.ids.tvdb;
                        }

                        // Strict matching to LibraryItem
                        if (!title) return null;

                        return {
                            type: item.type === 'episode' ? 'show' : 'movie',
                            title,
                            year,
                            poster_url,
                            tmdbId,
                            tvdbId,
                        } as LibraryItem;
                    } catch (e) {
                        logger.error('Error enriching history item: {e}', {
                            e,
                        });
                        return null;
                    }
                }),
            );

            // Filter out nulls
            const validHistory = enrichedHistory.filter(
                (item): item is LibraryItem => item !== null,
            );

            const withPosters = validHistory.filter((i) => i.poster_url).length;
            logger.info('History enrichment complete', {
                total: validHistory.length,
                withPosters,
            });

            return c.json<LibraryItem[]>(validHistory.slice(0, requestedLimit));
        } catch (error) {
            logger.error('Get history error: {error}', { error });
            return c.json({ error: 'Failed to get history' }, 500);
        }
    })
    // Get Trending movies/shows
    .get('/trending', async (c) => {
        try {
            const user = c.get('user');
            if (!user) return c.json({ error: 'Unauthorized' }, 401);

            // Fetch both (limit 20 each)
            const [movies, shows] = await Promise.all([
                traktService.getTrendingMovies(user.id),
                traktService.getTrendingShows(user.id),
            ]);

            // Transform to unified format and enrich
            const trendingMovies = await Promise.all(
                movies.slice(0, 15).map(async (item) => {
                    let poster_url = extractTraktImage(item.movie.images);
                    return {
                        type: 'movie',
                        title: item.movie.title,
                        year: item.movie.year,
                        poster_url,
                        tmdbId: item.movie.ids.tmdb,
                    } as LibraryItem;
                }),
            );

            const trendingShows = await Promise.all(
                shows.slice(0, 15).map(async (item) => {
                    let poster_url = extractTraktImage(item.show.images);
                    return {
                        type: 'show',
                        title: item.show.title,
                        year: item.show.year,
                        poster_url,
                        tvdbId: item.show.ids.tvdb,
                    } as LibraryItem;
                }),
            );

            // Interleave results
            const result: LibraryItem[] = [];
            const maxLength = Math.max(
                trendingMovies.length,
                trendingShows.length,
            );
            for (let i = 0; i < maxLength; i++) {
                if (i < trendingMovies.length) {
                    const item = trendingMovies[i];
                    if (item) result.push(item);
                }
                if (i < trendingShows.length) {
                    const item = trendingShows[i];
                    if (item) result.push(item);
                }
            }

            return c.json<LibraryItem[]>(result);
        } catch (error) {
            logger.error('Get trending error: {error}', { error });
            return c.json({ error: 'Failed to get trending' }, 500);
        }
    });

export default traktRoute;
