import { z } from 'zod';

export * from 'shared';

export const aiSettingsSchema = z.object({
    openaiApiKey: z.string().nullable().optional(),
    openaiBaseUrl: z
        .union([z.url(), z.literal('')])
        .nullable()
        .optional(),
    openaiModel: z.string().nullable().optional(),
});

export const mediaSettingsSchema = z.object({
    sonarrUrl: z
        .union([z.url(), z.literal('')])
        .nullable()
        .optional(),
    sonarrApiKey: z.string().nullable().optional(),
    radarrUrl: z
        .union([z.url(), z.literal('')])
        .nullable()
        .optional(),
    radarrApiKey: z.string().nullable().optional(),
    traktClientId: z.string().nullable().optional(),
    traktClientSecret: z.string().nullable().optional(),
    tmdbApiKey: z.string().nullable().optional(),
    posterSource: z
        .enum(['history', 'trending', 'library', ''])
        .nullable()
        .optional(),
});

export const settingsSchema = aiSettingsSchema.and(mediaSettingsSchema);
