import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

import {
    radarrAddTool,
    radarrSearchTool,
    sonarrAddTool,
    sonarrSearchTool,
    tmdbSearchTool,
    traktTrendingTool,
    traktWatchlistTool,
} from './tools';

const SYSTEM_PROMPT = `You are a helpful media assistant named Beavarr. You can manage user's media library via Sonarr and Radarr. You can also recommend content via Trakt and TMDB. Always search before adding content. Use the tools provided.`;

export async function createMediaAgent({
    openaiApiKey,
    openaiBaseUrl,
    openaiModel,
}: {
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
        sonarrSearchTool,
        sonarrAddTool,
        radarrSearchTool,
        radarrAddTool,
        traktTrendingTool,
        traktWatchlistTool,
        tmdbSearchTool,
    ];

    const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
    });

    return agent;
}
