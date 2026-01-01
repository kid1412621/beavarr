import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { sonarrService } from "../services/sonarr";
import { radarrService } from "../services/radarr";
import { traktService } from "../services/trakt";
import { tmdbService } from "../services/tmdb";

export const sonarrSearchTool = new DynamicStructuredTool({
    name: "sonarr_search",
    description: "Search for TV shows in Sonarr to find titles to add.",
    schema: z.object({
        term: z.string().describe("The search term (e.g., 'Breaking Bad')"),
    }),
    func: async ({ term }: { term: string }) => {
        try {
            const results = await sonarrService.search(term) as any[];
            return JSON.stringify(results.slice(0, 5)); // Limit to 5 results
        } catch (error) {
            return `Error searching Sonarr: ${error}`;
        }
    },
});

export const sonarrAddTool = new DynamicStructuredTool({
    name: "sonarr_add",
    description: "Add a TV show to Sonarr library. You MUST search first to get the correct TVDB ID.",
    schema: z.object({
        tvdbId: z.number().describe("The TVDB ID of the show to add"),
        title: z.string().describe("The title of the show"),
        titleSlug: z.string().describe("The slug of the title"),
        images: z.array(z.any()).optional().describe("Images array from search result"),
        seasons: z.array(z.any()).optional().describe("Seasons array from search result")
    }),
    func: async (seriesData: { tvdbId: number, title: string, titleSlug: string, images?: any[], seasons?: any[] }) => {
        try {
            const payload = {
                tvdbId: seriesData.tvdbId,
                title: seriesData.title,
                titleSlug: seriesData.titleSlug,
                images: seriesData.images || [],
                seasons: seriesData.seasons || [],
                // defaults handled in service
            };
            const result = await sonarrService.addSeries(payload);
            return JSON.stringify(result);
        } catch (error) {
            return `Error adding to Sonarr: ${error}`;
        }
    }
});

export const radarrSearchTool = new DynamicStructuredTool({
    name: "radarr_search",
    description: "Search for movies in Radarr.",
    schema: z.object({
        term: z.string().describe("The search term (e.g., 'Inception')"),
    }),
    func: async ({ term }: { term: string }) => {
        try {
            const results = await radarrService.search(term) as any[];
            return JSON.stringify(results.slice(0, 5));
        } catch (error) {
            return `Error searching Radarr: ${error}`;
        }
    },
});

export const radarrAddTool = new DynamicStructuredTool({
    name: "radarr_add",
    description: "Add a movie to Radarr library. You MUST search first to get the TMDB ID.",
    schema: z.object({
        tmdbId: z.number().describe("The TMDB ID of the movie"),
        title: z.string().describe("The title of the movie"),
        titleSlug: z.string().describe("The slug of the title"),
        images: z.array(z.any()).optional(),
        year: z.number().optional()
    }),
    func: async (movieData: { tmdbId: number, title: string, titleSlug: string, images?: any[], year?: number }) => {
        try {
            // Reconstruct payload
            // Radarr needs 'tmdbId', 'title', 'year', 'images' etc.
            const payload = {
                tmdbId: movieData.tmdbId,
                title: movieData.title,
                titleSlug: movieData.titleSlug,
                identifiers: { tmdbId: movieData.tmdbId }, // sometimes needed?
                images: movieData.images || [],
                year: movieData.year
            };
            const result = await radarrService.addMovie(payload);
            return JSON.stringify(result);
        } catch (error) {
            return `Error adding to Radarr: ${error}`;
        }
    }
});

export const traktTrendingTool = new DynamicStructuredTool({
    name: "trakt_trending",
    description: "Get trending movies or shows from Trakt.",
    schema: z.object({
        type: z.enum(['movies', 'shows']).describe("The type of content to fetch"),
    }),
    func: async ({ type }: { type: 'movies' | 'shows' }) => {
        try {
            if (type === 'movies') {
                const results = await traktService.getTrendingMovies() as any[];
                return JSON.stringify(results.slice(0, 10));
            } else {
                const results = await traktService.getTrendingShows() as any[];
                return JSON.stringify(results.slice(0, 10));
            }
        } catch (error) {
            return `Error fetching trending from Trakt: ${error}`;
        }
    },
});

export const tmdbSearchTool = new DynamicStructuredTool({
    name: "tmdb_search",
    description: "Search for metadata about movies or TV shows on TMDB to get details like cast, plot, etc.",
    schema: z.object({
        query: z.string().describe("Search query"),
    }),
    func: async ({ query }: { query: string }) => {
        try {
            const results = await tmdbService.searchMulti(query) as any;
            return JSON.stringify(results.results.slice(0, 5));
        } catch (error) {
            return `Error searching TMDB: ${error}`;
        }
    }
});
