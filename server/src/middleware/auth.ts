import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { MiddlewareHandler } from 'hono';
import { findUserByUsername } from '../db/repo/user';
import { type User } from '../db/schema';

export type Env = {
    Variables: {
        user: User;
    };
};

const JWT_SECRET = process.env.JWT_SECRET || 'beavarr_secret_key_change_me_in_production';

export const authMiddleware: MiddlewareHandler<Env> = async (c, next) => {
    // 1. Try JWT from cookie
    const token = getCookie(c, 'auth_token');
    if (token) {
        try {
            const payload = await verify(token, JWT_SECRET);
            if (payload && typeof payload.sub === 'string') {
                const username = payload.sub;
                const user = await findUserByUsername(username);
                if (user) {
                    c.set('user', user);
                    return await next();
                }
            }
        } catch (error) {
            // Token invalid or expired, fall through to Basic Auth
            console.error('JWT verification failed', error);
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

export const requirePasswordChange: MiddlewareHandler<Env> = async (c, next) => {
    const user = c.get('user');

    if (!user) {
        return c.text('Unauthorized', 401);
    }

    if (!user.isPasswordChanged) {
        // Allow access to change-password and verify endpoints 
        if (c.req.path === '/api/auth/change-password' || c.req.path === '/api/auth/verify') {
            return next();
        }

        return c.json({ error: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' }, 403);
    }

    await next();
};
