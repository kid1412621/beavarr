import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
    Sliders,
    Sparkles,
    Database,
    Tv,
    History,
    Server,
    Globe,
} from 'lucide-react';
import { toast } from 'sonner';

import { AiSettings } from '@/components/settings/ai-settings';
import { GeneralSettings } from '@/components/settings/general-settings';
import { JellyfinSettings } from '@/components/settings/jellyfin-settings';
import { MediaSettings } from '@/components/settings/media-settings';
import { RadarrSettings } from '@/components/settings/radarr-settings';
import { SonarrSettings } from '@/components/settings/sonarr-settings';
import { TraktSettings } from '@/components/settings/trakt-settings';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { client, settingsQueryOptions } from '@/lib/api';
import { useAppForm, getErrorMessage } from '@/lib/form';
import {
    type SettingsForm,
    settingsSchema,
    getDefaultSettingsValues,
} from '@/lib/types';

export const Route = createFileRoute('/settings')({
    component: Settings,
});

function Settings() {
    const { data: initialSettings, isPending } = useQuery(settingsQueryOptions);

    if (isPending) {
        return <div className="p-8">Loading settings...</div>;
    }

    return (
        <div className="p-4">
            <InnerForm
                key={initialSettings ? 'loaded' : 'empty'}
                initialValues={
                    initialSettings as SettingsForm | null | undefined
                }
            />
        </div>
    );
}

function InnerForm({
    initialValues,
}: {
    initialValues: SettingsForm | null | undefined;
}) {
    const queryClient = useQueryClient();
    const { mutate: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (values: SettingsForm) => {
            const res = await client.api.settings.$post({ json: values });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        },
        onSuccess: (data) => {
            toast.success('Settings saved!');
            queryClient.setQueryData(['settings'], data);
        },
    });

    const form = useAppForm({
        defaultValues: getDefaultSettingsValues(initialValues),
        validators: {
            onChange: settingsSchema,
        },
        onSubmit: async ({ value }) => {
            await saveSettings(value);
        },
    });

    return (
        <div className="mx-auto max-w-4xl">
            <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="px-4 sm:px-8">
                    <CardTitle className="text-2xl">Settings</CardTitle>
                    <CardDescription>
                        Configure your specific services.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-8">
                    <form.AppForm>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                            className="space-y-4"
                        >
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger
                                        value="general"
                                        className="flex items-center gap-2"
                                    >
                                        <Sliders className="h-4 w-4" />
                                        <span>General</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="ai"
                                        className="flex items-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            AI Settings
                                        </span>
                                        <span className="sm:hidden">AI</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="media"
                                        className="flex items-center gap-2"
                                    >
                                        <Database className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Media Services
                                        </span>
                                        <span className="sm:hidden">Media</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="general"
                                    className="mt-4"
                                    keepMounted
                                >
                                    <GeneralSettings />
                                </TabsContent>

                                <TabsContent
                                    value="ai"
                                    className="mt-4"
                                    keepMounted
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                AI Configuration
                                            </CardTitle>
                                            <CardDescription>
                                                Configure OpenAI or compatible
                                                LLM settings.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <AiSettings />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent
                                    value="media"
                                    className="mt-4 space-y-4"
                                    keepMounted
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Server className="text-primary h-5 w-5" />
                                                <span>Media Servers</span>
                                            </CardTitle>
                                            <CardDescription>
                                                Connect your self-hosted
                                                Jellyfin media server to sync
                                                your library, watch history, and
                                                metadata.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <JellyfinSettings />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Tv className="text-primary h-5 w-5" />
                                                <span>
                                                    Library Managers &
                                                    Automation
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                Connect to your Sonarr and
                                                Radarr instances to index and
                                                manage television series and
                                                movies.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <SonarrSettings />
                                            <Separator />
                                            <RadarrSettings />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="text-primary h-5 w-5" />
                                                <span>
                                                    Watch History & Sync
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                Sync your watch history and
                                                discover popular content with
                                                Trakt.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <TraktSettings />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Globe className="text-primary h-5 w-5" />
                                                <span>Metadata Services</span>
                                            </CardTitle>
                                            <CardDescription>
                                                Configure metadata providers
                                                like TMDB.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <MediaSettings />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                            <div className="flex w-full flex-col items-end gap-2 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full sm:w-auto"
                                >
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </Button>
                                <form.Subscribe
                                    selector={(state) => state.errors}
                                    children={(errors) => {
                                        const message = errors[0]
                                            ? getErrorMessage(errors[0])
                                            : undefined;
                                        return (
                                            <>
                                                {message && (
                                                    <p className="text-destructive text-xs font-medium">
                                                        {message}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </div>
                        </form>
                    </form.AppForm>
                </CardContent>
            </Card>
        </div>
    );
}
