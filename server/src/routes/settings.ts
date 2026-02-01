import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { settings } from "../db/schema";
import { getSettings } from "../db/utils";
import { createLogger } from "../lib/logger";
import { type SettingsForm } from "shared";

const logger = createLogger("settings");
const settingsRoute = new Hono()
    .get("/", async (c) => {
        try {
            const currentSettings = await getSettings();
            if (!currentSettings) {
                // Return default settings if none exist
                const inserted = await db.insert(settings).values({}).returning();
                return c.json(inserted[0]);
            }
            return c.json(currentSettings);
        } catch (error) {
            logger.error(error, "Error fetching settings");
            return c.json({ error: "Failed to fetch settings" }, 500);
        }
    })
    .post("/", async (c) => {
        try {
            const body = await c.req.json<SettingsForm>();
            const existing = await getSettings();

            if (existing) {
                // Update existing
                const updated = await db
                    .update(settings)
                    .set(body)
                    .where(eq(settings.id, existing.id))
                    .returning();
                return c.json(updated[0]);
            } else {
                // Create new
                // body might be partial but we rely on DB defaults
                const inserted = await db.insert(settings).values(body).returning();
                return c.json(inserted[0]);
            }
        } catch (error) {
            logger.error(error, "Error updating settings");
            return c.json({ error: "Failed to update settings" }, 500);
        }
    });

export default settingsRoute;
