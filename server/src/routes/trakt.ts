import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getSettings } from "../db/utils";
import { createLogger } from "../lib/logger";
import { traktService } from "../services/trakt";
import { traktOAuthService } from "../services/trakt_oauth";

const logger = createLogger("trakt");
const traktRoute = new Hono();

// Get authorization URL for Trakt OAuth
traktRoute.get("/auth-url", async (c) => {
    try {
        const settings = await getSettings();
        if (!settings?.traktClientId || !settings?.traktClientSecret) {
            return c.json({ error: "Trakt client credentials not configured" }, 400);
        }

        // Generate state for CSRF protection
        const state = randomUUID();

        // Store state in a cookie for validation on callback
        c.header(
            "Set-Cookie",
            `trakt_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
        );
        if (process.env.NODE_ENV === "production") {
            c.header(
                "Set-Cookie",
                `trakt_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600; Secure`,
            );
        }

        const authUrl = traktOAuthService.getAuthorizationUrl(settings.traktClientId!, state);
        const redirectUri = traktOAuthService.getRedirectUri();
        logger.info({ redirectUri }, "Trakt OAuth redirect URI:");
        return c.json({ authUrl, state });
    } catch (error) {
        logger.error(error, "Error generating auth URL");
        return c.json({ error: "Failed to generate authorization URL" }, 500);
    }
});

// OAuth callback - exchange code for tokens
// This endpoint handles the redirect from Trakt after user authorization
traktRoute.get("/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    // Handle OAuth errors from Trakt
    if (error) {
        return c.json({ error: `Authorization failed: ${error}` }, 400);
    }

    if (!code || !state) {
        return c.json(
            { error: "Authorization code or state is missing from the callback" },
            400,
        );
    }

    try {
        // Get state from cookie
        const cookieHeader = c.req.header("Cookie") || "";
        const stateMatch = cookieHeader.match(/trakt_oauth_state=([^;]+)/);
        const storedState = stateMatch ? stateMatch[1] : null;

        if (state !== storedState) {
            return c.json(
                { error: "Invalid state parameter. Please try connecting again" },
                400,
            );
        }

        // Clear state cookie
        c.header(
            "Set-Cookie",
            "trakt_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
        );

        // Exchange code for tokens
        const tokens = await traktOAuthService.exchangeCodeForTokens(code);

        // Save tokens
        await traktOAuthService.saveTokens(tokens);

        return c.json({ success: true, message: "Successfully connected to Trakt" });
    } catch (err) {
        logger.error(err, "OAuth callback error");
        return c.json(
            {
                error: "Failed to connect Trakt. Please try again.",
                details: err instanceof Error ? err.message : "Unknown error",
            },
            500,
        );
    }
});

// Refresh access token
traktRoute.post("/refresh", async (c) => {
    try {
        const settings = await getSettings();
        if (!settings?.traktRefreshToken) {
            return c.json({ error: "No refresh token available" }, 400);
        }

        const tokens = await traktOAuthService.refreshAccessToken(
            settings.traktRefreshToken,
        );
        await traktOAuthService.saveTokens(tokens);

        return c.json({ success: true });
    } catch (error) {
        logger.error(error, "Token refresh error");
        return c.json({ error: "Failed to refresh token" }, 500);
    }
});

// Disconnect Trakt
traktRoute.delete("/disconnect", async (c) => {
    try {
        await traktOAuthService.disconnect();
        return c.json({ success: true });
    } catch (error) {
        logger.error(error, "Disconnect error");
        return c.json({ error: "Failed to disconnect" }, 500);
    }
});

// Get Trakt connection status
traktRoute.get("/status", async (c) => {
    try {
        const settings = await getSettings();
        const isConnected = !!settings?.traktAccessToken;
        const isExpired = traktOAuthService.isTokenExpired(
            settings?.traktTokenExpiresAt ?? null,
        );

        return c.json({
            connected: isConnected,
            hasValidToken: isConnected && !isExpired,
            needsTokenRefresh: isConnected && isExpired,
        });
    } catch (error) {
        logger.error(error, "Status check error");
        return c.json({ error: "Failed to check status" }, 500);
    }
});

// Get authenticated Trakt user profile
traktRoute.get("/user", async (c) => {
    try {
        const user = await traktService.getUser();
        return c.json({
            id: user.id,
            username: user.username,
            name: user.name,
            vip: user.vip,
            vip_ep: user.vip_ep,
            avatar: user.images?.avatar?.full || null,
            joined: user.joined_at,
        });
    } catch (error) {
        logger.error(error, "Get user error");
        return c.json({ error: "Failed to get user" }, 500);
    }
});

// Proxy avatar image through server to avoid CORS issues
traktRoute.get("/avatar", async (c) => {
    const avatarUrl = c.req.query("url");
    if (!avatarUrl) {
        return c.json({ error: "Missing url parameter" }, 400);
    }

    try {
        const response = await fetch(avatarUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Beavarr/1.0)",
            },
        });

        if (!response.ok) {
            return c.json({ error: "Failed to fetch avatar" }, 500);
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        c.header("Content-Type", contentType);
        c.header("Cache-Control", "public, max-age=3600");

        const arrayBuffer = await response.arrayBuffer();
        return c.body(arrayBuffer);
    } catch (error) {
        logger.error(error, "Avatar proxy error");
        return c.json({ error: "Failed to fetch avatar" }, 500);
    }
});

// Get Trakt watchlist
traktRoute.get("/watchlist", async (c) => {
    try {
        const type = (c.req.query("type") as "movies" | "shows" | "all") || "all";
        const watchlist = await traktService.getWatchlist(type);
        return c.json(watchlist);
    } catch (error) {
        logger.error(error, "Get watchlist error");
        return c.json({ error: "Failed to get watchlist" }, 500);
    }
});

// === Device Flow Endpoints ===

// Start device authorization flow
traktRoute.post("/device/code", async (c) => {
    try {
        const deviceCode = await traktOAuthService.getDeviceCode();
        return c.json({
            device_code: deviceCode.device_code,
            user_code: deviceCode.user_code,
            verification_url: deviceCode.verification_url,
            expires_in: deviceCode.expires_in,
            interval: deviceCode.interval,
        });
    } catch (error) {
        logger.error(error, "Device code error");
        return c.json({ error: "Failed to start device authorization" }, 500);
    }
});

// Poll for device authorization completion
traktRoute.post("/device/poll", async (c) => {
    try {
        const { device_code } = await c.req.json();

        if (!device_code) {
            return c.json({ error: "device_code required" }, 400);
        }

        const tokens = await traktOAuthService.pollForToken(device_code);

        if (tokens === null) {
            // Still waiting for user authorization
            return c.json({ status: "pending" });
        }

        // Authorization successful, save tokens
        await traktOAuthService.saveTokens(tokens);

        // Get user info
        const user = await traktService.getUser();

        return c.json({
            status: "authorized",
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
            },
        });
    } catch (error) {
        logger.error(error, "Device poll error");
        return c.json({ error: "Failed to poll for authorization" }, 500);
    }
});

// Disconnect using device flow (with token revocation)
traktRoute.delete("/device", async (c) => {
    try {
        await traktOAuthService.disconnect();
        return c.json({ success: true });
    } catch (error) {
        logger.error(error, "Device disconnect error");
        return c.json({ error: "Failed to disconnect" }, 500);
    }
});

// Check if using custom credentials (advanced mode)
traktRoute.get("/auth-mode", async (c) => {
    try {
        const isCustom = await traktOAuthService.isUsingCustomCredentials();
        return c.json({
            mode: isCustom ? "authorization_code" : "device",
        });
    } catch (error) {
        logger.error(error, "Auth mode check error");
        return c.json({ error: "Failed to check auth mode" }, 500);
    }
});

export default traktRoute;
