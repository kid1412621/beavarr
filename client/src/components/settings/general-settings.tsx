import { useQuery } from '@tanstack/react-query';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
    const hasJellyfin = !!(settings?.jellyfinUrl && settings?.jellyfinApiKey);

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form.Subscribe
                    selector={(state) => state.values}
                    children={(values) => {
                        const hasSonarr = !!values.sonarrUrl;
                        const hasRadarr = !!values.radarrUrl;
                        const hasLibrary = hasSonarr || hasRadarr;

                        return (
                            <form.AppField
                                name="posterSource"
                                children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>
                                            Home Page Poster Source
                                        </Label>
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
                                                disabled={!hasTrakt}
                                            >
                                                {hasTrakt
                                                    ? 'History (Trakt)'
                                                    : 'History (Trakt - Not Connected)'}
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
                                                {hasLibrary
                                                    ? 'Library (Sonarr/Radarr)'
                                                    : 'Library (Not Configured)'}
                                            </option>
                                            <option
                                                value="jellyfin"
                                                disabled={!hasJellyfin}
                                            >
                                                {hasJellyfin
                                                    ? 'History (Jellyfin)'
                                                    : 'History (Jellyfin - Not Configured)'}
                                            </option>
                                        </select>
                                        <p className="text-muted-foreground text-[0.8rem]">
                                            Choose what to display on the home
                                            page background wall.
                                            {!hasTrakt &&
                                                !hasLibrary &&
                                                !hasJellyfin &&
                                                ' (Connect services to enable options)'}
                                        </p>
                                    </div>
                                )}
                            />
                        );
                    }}
                />
            </CardContent>
        </Card>
    );
}
