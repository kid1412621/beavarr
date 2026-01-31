import { Hono } from "hono";
import { createLogger } from "../lib/logger";
import { radarrService } from "../services/radarr";
import { sonarrService } from "../services/sonarr";
import { type LibraryItem } from "shared";

const logger = createLogger("library");

const libraryRoute = new Hono()
    .get("/", async (c) => {
        try {
            logger.info("Fetching library content");

            // Fetch validation
            // We do this in parallel
            const [movies, series] = await Promise.all([
                radarrService.getMovies().catch(e => {
                    logger.error({ error: e }, "Failed to fetch movies from Radarr");
                    return [];
                }),
                sonarrService.getSeries().catch(e => {
                    logger.error({ error: e }, "Failed to fetch series from Sonarr");
                    return [];
                })
            ]);

            logger.info({ movies: movies.length, series: series.length }, "Library fetched");

            // Transform to unified format
            const libraryMovies: LibraryItem[] = movies.map(m => {
                let poster_url = null;
                if (m.images) {
                    const poster = m.images.find(img => img.coverType === "poster");
                    if (poster) poster_url = poster.remoteUrl;
                }
                return {
                    type: 'movie',
                    title: m.title,
                    year: m.year,
                    poster_url,
                    tmdbId: m.tmdbId,
                    radarrId: m.id
                };
            });

            const libraryShows: LibraryItem[] = series.map(s => {
                let poster_url = null;
                if (s.images) {
                    const poster = s.images.find(img => img.coverType === "poster");
                    if (poster) poster_url = poster.remoteUrl;
                }
                return {
                    type: 'show',
                    title: s.title,
                    year: s.year,
                    poster_url,
                    tvdbId: s.tvdbId,
                    sonarrId: s.id
                };
            });

            // Combine and sort by added/year? Or just shuffle?
            // User probably wants most recently added.
            // Radarr has 'added', Sonarr has 'added'.

            const combined = [...libraryMovies, ...libraryShows].sort(() => 0.5 - Math.random()); // Shuffle for now as a "Library Wall"

            return c.json<LibraryItem[]>(combined);
        } catch (error) {
            logger.error(error, "Get library error");
            return c.json({ error: "Failed to get library" }, 500);
        }
    });

export default libraryRoute;
