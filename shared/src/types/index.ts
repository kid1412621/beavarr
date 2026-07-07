export type ApiResponse = {
    message: string;
    success: true;
};

export interface AiSettingsForm {
    openaiApiKey?: string | null;
    openaiBaseUrl?: string | null;
    openaiModel?: string | null;
}

export interface MediaSettingsForm {
    sonarrUrl?: string | null;
    sonarrApiKey?: string | null;
    radarrUrl?: string | null;
    radarrApiKey?: string | null;
    traktClientId?: string | null;
    traktClientSecret?: string | null;
    tmdbApiKey?: string | null;
    tvdbApiKey?: string | null;
    omdbApiKey?: string | null;
    jellyfinUrl?: string | null;
    jellyfinApiKey?: string | null;
    posterSource?: 'history' | 'trending' | 'library' | '' | null;
}

export type SettingsForm = AiSettingsForm & MediaSettingsForm;

// Chat Types
export interface ChatRequest {
    message: string;
}

export interface ChatMessage {
    role: string;
    content: string | unknown;
}

export interface ChatResponse {
    response: string;
    messages: ChatMessage[];
}

// Media Types
export const MEDIA_TYPES = ['movie', 'show'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

// Library Types
export interface LibraryItem {
    type: MediaType;
    title: string;
    year: number;
    poster_url: string | null;
    tmdbId?: number; // for movies
    tvdbId?: number; // for shows
    sonarrId?: number;
    radarrId?: number;
    jellyfinId?: string; // for Jellyfin-sourced items
}

// Trakt Types
export interface TraktAuthRequest {
    device_code: string;
}

export interface TraktDeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_url: string;
    expires_in: number;
    interval: number;
}

export interface TraktPollResponse {
    status: 'pending' | 'authorized';
    user?: {
        id: number;
        username: string;
        name: string;
    };
}

export interface TraktStatusResponse {
    connected: boolean;
    hasValidToken: boolean;
    needsTokenRefresh: boolean;
}

// Jellyfin Types
export interface JellyfinStatusResponse {
    connected: boolean;
    serverName?: string;
    version?: string;
}

export interface JellyfinUserResponse {
    id: string;
    name: string;
    serverId: string;
}

export interface TraktUserResponse {
    id: number;
    username: string;
    name: string;
    vip?: boolean;
    vip_ep?: boolean;
    avatar?: string | null;
    joined?: string;
}

export interface ServiceStatusResponse {
    connected: boolean;
    version?: string;
}

export const CONNECTABLE_SERVICES = [
    'sonarr',
    'radarr',
    'jellyfin',
    'tmdb',
    'tvdb',
    'omdb',
] as const;
export type ConnectableService = (typeof CONNECTABLE_SERVICES)[number];

// Franchise & Timeline Types
export interface TimelineItem {
    mediaId: number; // The movie's tmdbId or the show's tvdbId (table primary key)
    title: string;
    type: MediaType;
    releaseDate?: string;
    overview?: string;
    posterPath?: string | null;
    sonarrId?: number | null; // Reference ID in Sonarr
    radarrId?: number | null; // Reference ID in Radarr
    jellyfinId?: string | null; // Reference ID in Jellyfin
    order: number;
    seasonNumber?: number | null;
    inLibrary: boolean;
    libraryStatus?: string; // e.g. "monitored", "not_monitored", "not_in_library"
}

export interface FranchiseTimeline {
    id?: number;
    name: string;
    slug: string;
    items: TimelineItem[];
    updatedAt: string;
}

export interface FranchiseSearchResponse {
    results: {
        id: number;
        name: string;
        posterPath?: string | null;
        overview?: string;
        type: 'collection' | 'custom';
    }[];
}
