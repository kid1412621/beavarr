import { Hono } from 'hono';
import { type ChatRequest, type ChatResponse, type ChatMessage } from 'shared';

import { createMediaAgent } from '../agents/media_agent';
import { getSettings } from '../db/repo/settings';
import { type Env } from '../lib/auth';
import { createLogger } from '../lib/logger';

const logger = createLogger('chat');
const chatRoute = new Hono<Env>().post('/', async (c) => {
    try {
        const { message } = await c.req.json<ChatRequest>();
        if (!message) {
            return c.json({ error: 'Message is required' }, 400);
        }

        logger.info('Creating agent...');
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const settings = await getSettings(user.id);

        if (!settings?.openaiApiKey) {
            return c.json(
                {
                    error: 'OpenAI API Key not configured. Please go to settings.',
                },
                400,
            );
        }

        const agent = await createMediaAgent({
            userId: user.id,
            openaiApiKey: settings.openaiApiKey,
            openaiBaseUrl: settings.openaiBaseUrl,
            openaiModel: settings.openaiModel,
        });
        logger.info('Agent created. Invoking...');

        const result = await agent.invoke({
            messages: [{ role: 'user', content: message }],
        });

        logger.debug('Agent result', { result });

        // Extract the last assistant message from the result
        const messages = result.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        const responseContent = lastMessage
            ? typeof lastMessage.content === 'string'
                ? lastMessage.content
                : JSON.stringify(lastMessage.content)
            : 'No response from agent';

        // Map LangChain messages to ChatMessage
        const mappedMessages: ChatMessage[] = messages.map((m: any) => {
            // Try to determine role. LangChain messages often have 'type' or use class names.
            // Assuming 'human'/'user' and 'ai'/'assistant'.
            let role = 'assistant';
            if (
                m.constructor?.name === 'HumanMessage' ||
                m._getType?.() === 'human'
            ) {
                role = 'user';
            }
            return {
                role,
                content: m.content,
            };
        });

        return c.json<ChatResponse>({
            response: responseContent,
            messages: mappedMessages,
        });
    } catch (error: any) {
        logger.error('Chat error: {error}', { error });
        const errorMessage = error.message || 'Unknown error';
        if (errorMessage.includes('OpenAI API Key not configured')) {
            return c.json(
                {
                    error: 'OpenAI API Key not configured. Please go to settings.',
                },
                400,
            );
        }
        return c.json({ error: 'Failed to process chat request' }, 500);
    }
});

export default chatRoute;
