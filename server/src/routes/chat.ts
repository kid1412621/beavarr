import { Hono } from "hono";
import { createMediaAgent } from "../agents/media_agent";
import { getSettings } from "../db/utils";
import { createLogger } from "../lib/logger";

const logger = createLogger("chat");
const chatRoute = new Hono();

chatRoute.post("/", async (c) => {
    try {
        const { message } = await c.req.json();
        if (!message) {
            return c.json({ error: "Message is required" }, 400);
        }

        logger.info("Creating agent...");
        const settings = await getSettings();

        if (!settings?.openaiApiKey) {
            return c.json({ error: "OpenAI API Key not configured. Please go to settings." }, 400);
        }

        const agent = await createMediaAgent({
            openaiApiKey: settings.openaiApiKey,
            openaiBaseUrl: settings.openaiBaseUrl,
            openaiModel: settings.openaiModel
        });
        logger.info("Agent created. Invoking...");

        const result = await agent.invoke({
            messages: [{ role: "user", content: message }],
        });

        logger.debug({ result }, "Agent result");

        // Extract the last assistant message from the result
        const messages = result.messages ?? [];
        const lastMessage = messages[messages.length - 1];
        const responseContent = lastMessage
            ? (typeof lastMessage.content === 'string'
                ? lastMessage.content
                : JSON.stringify(lastMessage.content))
            : "No response from agent";

        return c.json({
            response: responseContent,
            messages: messages
        });
    } catch (error: any) {
        logger.error(error, "Chat error");
        const errorMessage = error.message || "Unknown error";
        if (errorMessage.includes("OpenAI API Key not configured")) {
            return c.json({ error: "OpenAI API Key not configured. Please go to settings." }, 400);
        }
        return c.json({ error: "Failed to process chat request" }, 500);
    }
});

export default chatRoute;
