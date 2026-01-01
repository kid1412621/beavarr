import { z } from 'zod';

// TODO: move to shared/
export const settingsSchema = z.object({
    sonarrUrl: z.string().url().optional().or(z.literal('')),
    sonarrApiKey: z.string().optional(),
    radarrUrl: z.string().url().optional().or(z.literal('')),
    radarrApiKey: z.string().optional(),
    traktClientId: z.string().optional(),
    traktClientSecret: z.string().optional(),
    tmdbApiKey: z.string().optional(),
    openaiApiKey: z.string().optional(),
    openaiBaseUrl: z.string().url().optional().or(z.literal('')),
});
export type SettingsForm = z.infer<typeof settingsSchema>;