# Integration Services

Refer to the official API documentation for external services used by Beavarr:

- **Jellyfin**: [Jellyfin API](https://api.jellyfin.org/)
- **Radarr**: [Radarr API](https://radarr.video/docs/api/)
- **Sonarr**: [Sonarr API](https://sonarr.tv/docs/api/#v5/)
- **Trakt**: [Trakt API](https://trakt.docs.apiary.io/)
- **TMDB**: [TMDB API](https://developer.themoviedb.org/v4/reference)
- **TVDB**: [TVDB API](https://thetvdb.github.io/v4-api/)
- **OMDB**: [OMDB API](https://www.omdbapi.com/#parameters)

## Service Capabilities Analysis

| Service | Media Management | Metadata (Movies) | Metadata (TV) | Watched History | Purpose & Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Jellyfin** | ✅ | ✅ | ✅ | ✅ | Local media streaming server. Manages local libraries, plays media, and tracks user watch progress. |
| **Radarr** | ✅ | ✅ | ❌ | ❌ | Movie collection manager. Automates searches, downloads (via Usenet/Torrents), and manages movie files. |
| **Sonarr** | ✅ | ❌ | ✅ | ❌ | TV show collection manager. Automates series episode tracking, downloads, and organizes TV files. |
| **Trakt** | ❌ | ⚠️ (Basic) | ⚠️ (Basic) | ✅ | Cloud-based media tracking platform. Syncs watched history, ratings, and watchlists across various players. |
| **TMDB** | ❌ | ✅ | ✅ | ❌ | Community-built movie and TV database. High-quality metadata, poster/backdrop imagery, and cast/crew details. |
| **TVDB** | ❌ | ✅ | ✅ | ❌ | Comprehensive TV and movie database. Excellent structure for seasons, episode metadata, and artwork. |
| **OMDB** | ❌ | ✅ | ✅ | ❌ | Lightweight, queryable web API. Provides general movie/show details and IMDb ratings. |

### Detailed Breakdown

#### 1. Media Management
* **Jellyfin**: Serves as the playback host. It hosts files and manages streaming clients.
* **Radarr**: Specifically manages the movie files on disk, monitoring missing files, and sending download instructions to torrent/Usenet clients.
* **Sonarr**: Specifically manages the TV series files on disk (episodes, seasons) and coordinates downloads.

#### 2. Metadata Providing
* **TMDB**: Primary source for rich metadata, biographies, poster graphics, and translations for both Movies and TV.
* **TVDB**: The industry standard source for episode lists, season numbers, air dates, and TV show order configurations.
* **OMDB**: Extremely fast lookup service, useful for fetching IMDb/Rotten Tomatoes scores and basic details.
* **Radarr/Sonarr**: Internally map database indexes (Radarr uses TMDB; Sonarr uses TVDB) to coordinate their download search strings.

#### 3. Watched History
* **Jellyfin**: Tracks local playback/scrobble state (what has been watched inside this specific server).
* **Trakt**: The central synchronization point. Consolidates watch logs, user watchlists, check-ins, and scrobbles globally across different platforms (Kodi, Plex, Jellyfin, etc.).
