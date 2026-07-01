import { honoLogger } from '@logtape/hono';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import type { ApiResponse } from 'shared/dist';

import { initAdminUser } from './db/repo/user';
import { logger } from './lib/logger';
import { authMiddleware, requirePasswordChange } from './middleware/auth';
import authRoute from './routes/auth';
import chatRoute from './routes/chat';
import franchiseRoute from './routes/franchise';
import historyRoute from './routes/history';
import jellyfinRoute from './routes/jellyfin';
import libraryRoute from './routes/library';
import settingsRoute from './routes/settings';
import traktRoute from './routes/trakt';

const port = parseInt(process.env.PORT || '4242');

const app = new Hono();

app.use(
    honoLogger({
        skip: (c) => c.req.path === '/api/health',
    }),
);

// api
if (process.env.NODE_ENV !== 'production') {
    app.use(
        cors({
            origin: (origin) => origin,
            credentials: true,
        }),
    );
}

// Init default admin user
initAdminUser().catch((err) => {
    logger.error('Failed to initialize admin user', { err });
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
    .route('/jellyfin', jellyfinRoute)
    .route('/library', libraryRoute)
    .route('/history', historyRoute)
    .route('/chat', chatRoute)
    .route('/franchise', franchiseRoute)
    .get('/', (c) => {
        return c.text('Hello Hono!');
    })
    .get('/health', async (c) => {
        const data: ApiResponse = {
            message: 'Server is healthy',
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

logger.info('Server starting', { port });
