import { Hono } from 'hono';
import { findUserByUsername, updateUserPassword } from '../db/repo/user';

const app = new Hono();

app.post('/verify', async (c) => {
    // This endpoint is protected by Basic Auth (applied at the parent route or middleware)
    // If we reach here, the user is authenticated.
    // We just return the user status.

    const credentials = c.req.header('Authorization');
    if (!credentials) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const base64Credentials = credentials.split(' ')[1];
    if (!base64Credentials) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const [username] = Buffer.from(base64Credentials, 'base64').toString().split(':');
    if (!username) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const user = await findUserByUsername(username);
    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
        success: true,
        user: {
            username: user.username,
            isPasswordChanged: user.isPasswordChanged
        }
    });
});

app.post('/change-password', async (c) => {
    const body = await c.req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
        return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const credentials = c.req.header('Authorization');
    if (!credentials) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const base64Credentials = credentials.split(' ')[1];
    if (!base64Credentials) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const [username] = Buffer.from(base64Credentials, 'base64').toString().split(':');
    if (!username) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const user = await findUserByUsername(username);
    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    const hashedPassword = await Bun.password.hash(newPassword, {
        algorithm: 'bcrypt',
        cost: 10,
    });

    await updateUserPassword(user.id, hashedPassword, true);

    return c.json({ success: true, message: 'Password updated successfully' });
});

export default app;
