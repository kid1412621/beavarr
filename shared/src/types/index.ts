export type ApiResponse = {
  message: string;
  success: true;
}

export interface AiSettingsForm {
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
}

export interface MediaSettingsForm {
  sonarrUrl?: string;
  sonarrApiKey?: string;
  radarrUrl?: string;
  radarrApiKey?: string;
  traktClientId?: string;
  traktClientSecret?: string;
  tmdbApiKey?: string;
  posterSource?: 'history' | 'trending' | 'library' | '';
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

// Library Types
export interface LibraryItem {
  type: 'movie' | 'show';
  title: string;
  year: number;
  poster_url: string | null;
  tmdbId?: number; // for movies
  tvdbId?: number; // for shows
  sonarrId?: number;
  radarrId?: number;
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

export interface TraktUserResponse {
  id: number;
  username: string;
  name: string;
  vip?: boolean;
  vip_ep?: boolean;
  avatar?: string | null;
  joined?: string;
}
