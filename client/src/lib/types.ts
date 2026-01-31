import { z } from 'zod';

// TODO: move to shared/
export const aiSettingsSchema = z.object({
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.url().optional().or(z.literal('')),
    // openaiModel might be missing in original types but present in DB schema, adding it for completeness if needed, 
    // but based on previous view_file it wasn't there. DB schema has it. I should add it.
    openaiModel: z.string().optional(),
});

export const mediaSettingsSchema = z.object({
    sonarrUrl: z.url().optional().or(z.literal('')),
    sonarrApiKey: z.string().optional(),
    radarrUrl: z.url().optional().or(z.literal('')),
    radarrApiKey: z.string().optional(),
    traktClientId: z.string().optional(),
    traktClientSecret: z.string().optional(),
    tmdbApiKey: z.string().optional(),
    posterSource: z.enum(['history', 'trending', 'library']),
});

export const settingsSchema = aiSettingsSchema.extend(mediaSettingsSchema.shape);

export type AiSettingsForm = z.infer<typeof aiSettingsSchema>;
export type MediaSettingsForm = z.infer<typeof mediaSettingsSchema>;
export type SettingsForm = z.infer<typeof settingsSchema>;