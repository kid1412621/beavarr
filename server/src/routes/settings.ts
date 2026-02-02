import { Hono } from "hono";
import { getOrCreateSettings, updateSettings } from "../db/repo/settings";
import { createLogger } from "../lib/logger";
import { type SettingsForm } from "shared";

const logger = createLogger("settings");
const settingsRoute = new Hono()
    .get("/", async (c) => {
        try {
            const currentSettings = await getOrCreateSettings();
            return c.json(currentSettings);
        } catch (error) {
            logger.error(error, "Error fetching settings");
            return c.json({ error: "Failed to fetch settings" }, 500);
        }
    })
    .post("/", async (c) => {
        try {
            const body = await c.req.json<SettingsForm>();
            const updated = await updateSettings(body);
            return c.json(updated);
        } catch (error) {
            logger.error(error, "Error updating settings");
            return c.json({ error: "Failed to update settings" }, 500);
        }
    });

export default settingsRoute;

