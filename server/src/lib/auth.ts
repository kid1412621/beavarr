import { type User } from '../db/schema';

export type Env = {
    Variables: {
        user: User;
    };
};

export const JWT_SECRET =
    process.env.JWT_SECRET || 'beavarr_secret_key_change_me_in_production';
