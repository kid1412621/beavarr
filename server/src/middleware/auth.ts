import { basicAuth } from 'hono/basic-auth';
import type { MiddlewareHandler } from 'hono';
import { findUserByUsername } from '../db/repo/user';

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const auth = basicAuth({
        verifyUser: async (username, password, _c) => {
            const user = await findUserByUsername(username);
            if (!user) return false;

            // Verify password
            // Assuming the stored password is a hash and we verify it
            // If using bun:
            const isMatch = await Bun.password.verify(password, user.password);
            return isMatch;
        },
    });

    return auth(c, next);
};

export const requirePasswordChange: MiddlewareHandler = async (c, next) => {
    // This middleware should run AFTER authMiddleware so we have the user context if needed
    // But standard basicAuth doesn't easily put the user object in context.
    // We might need to re-fetch or store it.

    // Actually, for basic auth, the browser sends creds on every request.
    // So we can re-verify or trust the basicAuth middleware passed.

    // However, to check `isPasswordChanged`, we need the user object.
    // Let's modify the auth flow slightly.

    // Better approach:
    // 1. `authMiddleware` verifies credentials AND attaches user to context.
    // 2. `requirePasswordChange` checks user.isPasswordChanged.

    // Hono's basicAuth is good but maybe too simple if we need the user object.
    // Let's implement a custom wrapper or just fetch user again?
    // Fetching user again is fine for now, or we can customize.
    const credentials = c.req.header('Authorization');
    if (!credentials) {
        // If not authenticated (which shouldn't happen if authMiddleware is used), skip?
        // Or return error?
        // If this middleware is used, we assume auth is required.
        return c.text('Unauthorized', 401);
    }

    // Extract username from header to find user
    const base64Credentials = credentials.split(' ')[1];
    if (!base64Credentials) {
        return c.text('Unauthorized', 401);
    }
    const [username, _password] = Buffer.from(base64Credentials, 'base64').toString().split(':');
    if (!username) {
        return c.text('Unauthorized', 401);
    }
    const user = await findUserByUsername(username);
    if (!user) {
        return c.text('Unauthorized', 401);
    }

    if (!user.isPasswordChanged) {
        // Allow access to change-password endpoint 
        if (c.req.path === '/api/auth/change-password' || c.req.path === '/api/auth/verify') {
            return next();
        }

        return c.json({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' }, 403);
    }

    // Attach user to context if needed later
    c.set('user', user);

    await next();
};
