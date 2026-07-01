import { ChatOpenAI } from '@langchain/openai';
import type { MediaType } from 'shared';

import { getSettings } from '../db/repo/settings';

export interface AITimelineResult {
    name: string;
    items: Array<{
        title: string;
        type: MediaType;
        releaseYear?: number;
        tmdbId?: number | null;
        seasonNumber?: number | null;
    }>;
}

export async function generateAITimeline(
    userId: number,
    slug: string,
): Promise<AITimelineResult> {
    const settings = await getSettings(userId);
    if (!settings?.openaiApiKey) {
        throw new Error('OpenAI API Key is required to build custom timelines');
    }

    const model = new ChatOpenAI({
        apiKey: settings.openaiApiKey,
        model: settings.openaiModel || 'gpt-4o-mini',
        temperature: 0,
        configuration: {
            baseURL: settings.openaiBaseUrl || undefined,
        },
    });

    const prompt = `You are a professional movie and TV show database expert.
Generate a chronological timeline (in story order, or release order if story order doesn't apply) for the franchise or topic: "${slug}".
Include both movies and TV shows/series that are part of this franchise.

Return ONLY a JSON object with this exact structure:
{
  "name": "Star Wars Cinematic Universe",
  "items": [
    {
      "title": "Star Wars: Episode I - The Phantom Menace",
      "type": "movie",
      "releaseYear": 1999,
      "tmdbId": 1893,
      "seasonNumber": null
    },
    {
      "title": "Star Wars: The Clone Wars",
      "type": "show",
      "releaseYear": 2008,
      "tmdbId": 41263,
      "seasonNumber": null
    }
  ]
}

Ensure all significant entries in the franchise are included. Make sure "tmdbId" is correct if you know it, otherwise set it to null.
Do NOT include any markdown formatting, backticks, or comments. Just the raw JSON.`;

    const response = await model.invoke(prompt);
    const content =
        typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

    // Clean up possible markdown code block wrapper
    const jsonText = content
        .replace(/^```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();
    const parsed = JSON.parse(jsonText);
    return {
        name: parsed.name || slug,
        items: parsed.items || [],
    };
}
