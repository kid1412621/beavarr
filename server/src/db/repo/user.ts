import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

import { logger } from '../../lib/logger';
import { db } from '../index';
import { users, type InsertUser } from '../schema';

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
        logger.info("Creating default admin user...");

        let password = process.env.ADMIN_PASSWORD;
        let isRandom = false;

        if (!password) {
            password = randomBytes(8).toString('hex');
            isRandom = true;
        }

        let passwordHash = '';
        try {
            passwordHash = await Bun.password.hash(password, {
                algorithm: 'bcrypt',
                cost: 10,
            });
        } catch (e) {
            logger.error("Failed to hash password");
            throw e;
        }

        await createUser({
            username: adminUsername,
            password: passwordHash,
            isPasswordChanged: false,
        });

        if (isRandom) {
            logger.warn("**************************************************");
            logger.warn("INITIAL ADMIN PASSWORD: {password}", { password });
            logger.warn("Please log in and change this password immediately.");
            logger.warn("**************************************************");
        } else {
            logger.info("Admin user created with password from environment.");
        }
    } else {
        logger.info("Admin user already exists.");
    }
}
