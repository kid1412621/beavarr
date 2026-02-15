import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

import {
    createRadarrAddTool,
    createRadarrSearchTool,
    createSonarrAddTool,
    createSonarrSearchTool,
    createTmdbSearchTool,
    createTraktTrendingTool,
    createTraktWatchlistTool,
} from './tools';

const SYSTEM_PROMPT = `You are a helpful media assistant named Beavarr. You can manage user's media library via Sonarr and Radarr. You can also recommend content via Trakt and TMDB. Always search before adding content. Use the tools provided.`;

export async function createMediaAgent({
    userId,
    openaiApiKey,
    openaiBaseUrl,
    openaiModel,
}: {
    userId: number;
    openaiApiKey: string;
    openaiBaseUrl?: string | null;
    openaiModel?: string | null;
}) {
    if (!openaiApiKey) {
        throw new Error('OpenAI API Key not configured');
    }

    const model = new ChatOpenAI({
        apiKey: openaiApiKey,
        model: openaiModel || 'gpt-4.1-nano',
        temperature: 0,
        configuration: {
            baseURL: openaiBaseUrl || undefined,
        },
    });

    const tools = [
        createSonarrSearchTool(userId),
        createSonarrAddTool(userId),
        createRadarrSearchTool(userId),
        createRadarrAddTool(userId),
        createTraktTrendingTool(userId),
        createTraktWatchlistTool(userId),
        createTmdbSearchTool(userId),
    ];

    const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
    });

    return agent;
}
