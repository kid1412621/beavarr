import { eq } from 'drizzle-orm';
import { db } from '../index';
import { users, type InsertUser } from '../schema';
import { logger } from '../../lib/logger';

export async function findUserByUsername(username: string) {
    const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
    return result[0] || null;
}

export async function createUser(user: InsertUser) {
    const inserted = await db.insert(users).values(user).returning();
    return inserted[0];
}

export async function updateUserPassword(
    id: number,
    passwordHash: string,
    isPasswordChanged: boolean = true,
) {
    const updated = await db
        .update(users)
        .set({
            password: passwordHash,
            isPasswordChanged,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
    return updated[0];
}

export async function initAdminUser() {
    const adminUsername = 'admin';
    const existingAdmin = await findUserByUsername(adminUsername);

    if (!existingAdmin) {
        logger.info('Creating default admin user...');
        // Default password is 'changeme'
        // We need to hash it. Using bun's built-in password hashing if available or a library.
        // Since we are in an agent environment and I cannot easily check for bun version features without running it,
        // I will assume specific hashing implementation will be passed or handled.
        // For now, I'll use Bun.password.hash if available in the environment.

        let passwordHash = '';
        try {
            passwordHash = await Bun.password.hash('changeme', {
                algorithm: 'bcrypt',
                cost: 10,
            });
        } catch (e) {
            logger.error('Failed to hash password with Bun.password, using fallback or erroring out.');
            throw e;
        }

        await createUser({
            username: adminUsername,
            password: passwordHash,
            isPasswordChanged: false,
        });
        logger.info('Default admin user created.');
    } else {
        logger.info('Admin user already exists.');
    }
}
