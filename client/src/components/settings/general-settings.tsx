import { useQuery } from '@tanstack/react-query';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
} from '@/components/ui/field';
import { settingsQueryOptions } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

export function GeneralSettings() {
    const form = useAppFormContext<SettingsForm>();
    // We need real settings data to validation availability of services
    // Since we are inside the form, initialValues might be stale if user just typed something but didn't save?
    // Actually, rely on saved settings for availability check is safer/easier.
    const { data: settings } = useQuery(settingsQueryOptions);
    const hasTrakt = !!settings?.traktAccessToken;

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <form.Subscribe
                    selector={(state) => state.values}
                    children={(values) => {
                        const hasSonarr = !!values.sonarrUrl;
                        const hasRadarr = !!values.radarrUrl;
                        const hasJellyfinVal = !!(
                            values.jellyfinUrl && values.jellyfinApiKey
                        );
                        const hasLibrary =
                            hasSonarr || hasRadarr || hasJellyfinVal;
                        const hasHistory = hasTrakt || hasJellyfinVal;

                        // Build dynamic labels
                        let historyLabel = 'Watch History (Not Connected)';
                        if (hasTrakt && hasJellyfinVal) {
                            historyLabel = 'Watch History (Trakt & Jellyfin)';
                        } else if (hasTrakt) {
                            historyLabel = 'Watch History (Trakt)';
                        } else if (hasJellyfinVal) {
                            historyLabel = 'Watch History (Jellyfin)';
                        }

                        let libraryLabel = 'Library (Not Configured)';
                        const libraryParts: string[] = [];
                        if (hasSonarr || hasRadarr)
                            libraryParts.push('Sonarr/Radarr');
                        if (hasJellyfinVal) libraryParts.push('Jellyfin');
                        if (libraryParts.length > 0) {
                            libraryLabel = `Library (${libraryParts.join(' & ')})`;
                        }

                        return (
                            <form.AppField
                                name="posterSource"
                                children={(field) => {
                                    const hasError = !!(
                                        field.state.meta.errors &&
                                        field.state.meta.errors.length > 0
                                    );
                                    return (
                                        <Field data-invalid={hasError}>
                                            <FieldLabel htmlFor={field.name}>
                                                Home Page Poster Source
                                            </FieldLabel>
                                            <select
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target
                                                            .value as SettingsForm['posterSource'],
                                                    )
                                                }
                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    None (Empty)
                                                </option>
                                                <option
                                                    value="history"
                                                    disabled={!hasHistory}
                                                >
                                                    {historyLabel}
                                                </option>
                                                <option
                                                    value="trending"
                                                    disabled={!hasTrakt}
                                                >
                                                    {hasTrakt
                                                        ? 'Trending (Trakt)'
                                                        : 'Trending (Trakt - Not Connected)'}
                                                </option>
                                                <option
                                                    value="library"
                                                    disabled={!hasLibrary}
                                                >
                                                    {libraryLabel}
                                                </option>
                                            </select>
                                            <FieldDescription>
                                                Choose what to display on the
                                                home page background wall.
                                                Connect Trakt or Jellyfin for
                                                history, or
                                                Sonarr/Radarr/Jellyfin for
                                                library.
                                                {!hasTrakt &&
                                                    !hasLibrary &&
                                                    ' (Connect services to enable options)'}
                                            </FieldDescription>
                                            {hasError && (
                                                <FieldError>
                                                    {field.state.meta.errors?.join(
                                                        ', ',
                                                    )}
                                                </FieldError>
                                            )}
                                        </Field>
                                    );
                                }}
                            />
                        );
                    }}
                />
            </CardContent>
        </Card>
    );
}
