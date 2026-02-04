import { z } from 'zod';

export * from 'shared';

export const aiSettingsSchema = z.object({
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.union([z.url(), z.literal('')]).optional(),
    openaiModel: z.string().optional(),
});

export const mediaSettingsSchema = z.object({
    sonarrUrl: z.union([z.url(), z.literal('')]).optional(),
    sonarrApiKey: z.string().optional(),
    radarrUrl: z.union([z.url(), z.literal('')]).optional(),
    radarrApiKey: z.string().optional(),
    traktClientId: z.string().optional(),
    traktClientSecret: z.string().optional(),
    tmdbApiKey: z.string().optional(),
    posterSource: z.enum(['history', 'trending', 'library', '']).optional(),
});

export const settingsSchema = aiSettingsSchema.and(mediaSettingsSchema);
