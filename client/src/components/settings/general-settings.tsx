
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { settingsQueryOptions } from "@/lib/api"
import { Label } from "@/components/ui/label"

export function GeneralSettings({ form }: { form: any }) {
    // We need real settings data to validation availability of services
    // Since we are inside the form, initialValues might be stale if user just typed something but didn't save?
    // Actually, rely on saved settings for availability check is safer/easier.
    const { data: settings } = useQuery(settingsQueryOptions);
    const hasTrakt = !!settings?.traktAccessToken;

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>
                    Customize your experience.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form.Subscribe
                    selector={(state: any) => state.values}
                    children={(values: any) => {
                        const hasSonarr = !!values.sonarrUrl;
                        const hasRadarr = !!values.radarrUrl;
                        const hasLibrary = hasSonarr || hasRadarr;

                        return (
                            <form.Field
                                name="posterSource"
                                children={(field: any) => (
                                    <div className="space-y-2">
                                        <Label htmlFor={field.name}>Home Page Poster Source</Label>
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value || ''}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">None (Empty)</option>
                                            <option value="history" disabled={!hasTrakt}>
                                                {hasTrakt ? "History (Trakt)" : "History (Trakt - Not Connected)"}
                                            </option>
                                            <option value="trending" disabled={!hasTrakt}>
                                                {hasTrakt ? "Trending (Trakt)" : "Trending (Trakt - Not Connected)"}
                                            </option>
                                            <option value="library" disabled={!hasLibrary}>
                                                {hasLibrary ? "Library (Sonarr/Radarr)" : "Library (Not Configured)"}
                                            </option>
                                        </select>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Choose what to display on the home page background wall.
                                            {!hasTrakt && !hasLibrary && " (Connect services to enable options)"}
                                        </p>
                                    </div>
                                )}
                            />
                        );
                    }}
                />
            </CardContent>
        </Card>
    )
}
