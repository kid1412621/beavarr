import type { MiddlewareHandler } from 'hono';
import { getCookie, deleteCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

import { findUserByUsername } from '../db/repo/user';
import { type Env, JWT_SECRET } from '../lib/auth';

const WHITELIST = ['/api/health'];

export const authMiddleware: MiddlewareHandler<Env> = async (c, next) => {
    if (WHITELIST.includes(c.req.path)) {
        return await next();
    }

    // 1. Try JWT from cookie
    const token = getCookie(c, 'auth_token');
    if (token) {
        try {
            const payload = await verify(token, JWT_SECRET, 'HS256');
            if (payload && typeof payload.sub === 'string') {
                const username = payload.sub;
                const user = await findUserByUsername(username);
                if (user) {
                    c.set('user', user);
                    return await next();
                }
            }
        } catch (error: any) {
            // Token invalid or expired, clear the cookie and fall through to Basic Auth
            // We use logger or console without passing the error object to avoid huge stack traces
            deleteCookie(c, 'auth_token', { path: '/' });
        }
    }

    // 2. Fallback to Basic Auth (for login/verification)
    const credentials = c.req.header('Authorization');
    if (!credentials) {
        // Only require WWW-Authenticate if not already authenticated via cookie
        // But for API uniformity, we just return 401.
        return c.text('Unauthorized', 401);
    }

    const [type, base64Credentials] = credentials.split(' ');
    if (type !== 'Basic' || !base64Credentials) {
        return c.text('Unauthorized', 401);
    }

    const [username, password] = Buffer.from(base64Credentials, 'base64')
        .toString()
        .split(':');

    if (!username || !password) {
        return c.text('Unauthorized', 401);
    }

    const user = await findUserByUsername(username);
    if (!user) {
        return c.text('Unauthorized', 401);
    }

    const isMatch = await Bun.password.verify(password, user.password);
    if (!isMatch) {
        return c.text('Unauthorized', 401);
    }

    c.set('user', user);
    await next();
};

export const requirePasswordChange: MiddlewareHandler<Env> = async (
    c,
    next,
) => {
    if (WHITELIST.includes(c.req.path)) {
        return await next();
    }

    const user = c.get('user');

    if (!user) {
        return c.text('Unauthorized', 401);
    }

    if (!user.isPasswordChanged) {
        // Allow access to change-password and verify endpoints
        if (
            c.req.path === '/api/auth/change-password' ||
            c.req.path === '/api/auth/verify'
        ) {
            return next();
        }

        return c.json(
            {
                error: 'Password change required',
                code: 'PASSWORD_CHANGE_REQUIRED',
            },
            403,
        );
    }

    await next();
};
