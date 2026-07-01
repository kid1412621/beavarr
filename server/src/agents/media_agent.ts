import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

import {
    createJellyfinHistoryTool,
    createJellyfinLibraryTool,
    createJellyfinSearchTool,
    createRadarrAddTool,
    createRadarrListTool,
    createRadarrSearchTool,
    createSonarrAddTool,
    createSonarrListTool,
    createSonarrSearchTool,
    createTmdbSearchTool,
    createTraktTrendingTool,
    createTraktWatchlistTool,
    createFranchiseTimelineTool,
    createFranchiseAddMissingTool,
} from './tools';

const SYSTEM_PROMPT = `You are a helpful media assistant named Beavarr.
    You can manage user's media library via Sonarr and Radarr.
    You can also recommend content via Trakt and TMDB.
    You have access to the user's Jellyfin media server for library browsing, watch history, and searching local content.
    You can lookup show/movie franchise chronology (timelines) and help batch add missing franchise titles.
    Always search before adding content.
    Use the tools provided.`;

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
        createSonarrListTool(userId),
        createRadarrSearchTool(userId),
        createRadarrAddTool(userId),
        createRadarrListTool(userId),
        createTraktTrendingTool(userId),
        createTraktWatchlistTool(userId),
        createTmdbSearchTool(userId),
        createJellyfinLibraryTool(userId),
        createJellyfinHistoryTool(userId),
        createJellyfinSearchTool(userId),
        createFranchiseTimelineTool(userId),
        createFranchiseAddMissingTool(userId),
    ];

    const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
    });

    return agent;
}
