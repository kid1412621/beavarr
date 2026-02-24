import type { ApiResponse } from 'shared/dist';

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';

import { logger } from './lib/logger';

const port = parseInt(process.env.PORT || '4242');

const app = new Hono();

// Debug middleware - log all outgoing responses
// app.use("*", async (c, next) => {
// 	await next();
// 	const status = c.res.status;

// 	logger.info(
// 		`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} -> ${status}`,
// 	);
// });

// api
if (process.env.NODE_ENV !== 'production') {
    app.use(
        cors({
            origin: (origin) => origin,
            credentials: true,
        }),
    );
}

import { initAdminUser } from './db/repo/user';
import { authMiddleware, requirePasswordChange } from './middleware/auth';
import authRoute from './routes/auth';
import chatRoute from './routes/chat';
import libraryRoute from './routes/library';
import settingsRoute from './routes/settings';
import traktRoute from './routes/trakt';

// Init default admin user
initAdminUser().catch((err) => {
    logger.error({ err }, 'Failed to initialize admin user');
});

// Protect all API routes with Basic Auth
// We exempt /api/auth/* partially (handled inside) but basic auth is needed.
app.use('/api/*', authMiddleware);
app.use('/api/*', requirePasswordChange);

export const route = app
    .basePath('/api')
    .route('/auth', authRoute)
    .route('/settings', settingsRoute)
    .route('/trakt', traktRoute)
    .route('/library', libraryRoute)
    .route('/chat', chatRoute)
    .get('/', (c) => {
        return c.text('Hello Hono!');
    })

    .get('/hello', async (c) => {
        const data: ApiResponse = {
            message: 'Hello BHVR!',
            success: true,
        };

        return c.json(data, { status: 200 });
    });

// ui
app.use('*', serveStatic({ root: './static' })).get('*', async (c, next) => {
    return serveStatic({ root: './static', path: 'index.html' })(c, next);
});

export default {
    port,
    fetch: app.fetch,
};

logger.info({ port }, 'Server starting');
