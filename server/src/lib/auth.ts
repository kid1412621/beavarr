import crypto from 'crypto';

import { type User } from '../db/schema';
import { logger } from './logger';
export type Env = {
    Variables: {
        user: User;
    };
};

let secret = process.env.JWT_SECRET;

if (!secret) {
    logger.warn(
        'JWT_SECRET environment variable is not set. A random secret has been generated for this session. ' +
            'Users will be logged out when the server restarts. To prevent this, please set JWT_SECRET in your environment.',
    );
    secret = crypto.randomBytes(32).toString('hex');
}

export const JWT_SECRET = secret;
