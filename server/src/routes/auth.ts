import { sign } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { updateUserPassword } from '../db/repo/user';
import { type Env } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'beavarr_secret_key_change_me_in_production';

const authRoute = new Hono<Env>()
    .post('/verify', async (c) => {
        // This endpoint is protected by Basic Auth (applied at the parent route or middleware)
        // If we reach here, the user is authenticated and attached to the context.

        const user = c.get('user');

        // Generate JWT
        const token = await sign({
            sub: user.username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
        }, JWT_SECRET);

        // Set HttpOnly cookie
        setCookie(c, 'auth_token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return c.json({
            success: true,
            user: {
                username: user.username,
                isPasswordChanged: user.isPasswordChanged,
            },
        });
    })
    .post('/change-password', async (c) => {
        const body = await c.req.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return c.json({ error: 'Password must be at least 8 characters' }, 400);
        }

        const user = c.get('user');

        const hashedPassword = await Bun.password.hash(newPassword, {
            algorithm: 'bcrypt',
            cost: 10,
        });

        await updateUserPassword(user.id, hashedPassword, true);

        return c.json({ success: true, message: 'Password updated successfully' });
    })
    .post('/logout', async (c) => {
        deleteCookie(c, 'auth_token', {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });
        return c.json({ success: true });
    });

export default authRoute;
