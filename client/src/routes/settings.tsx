import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SonarrSettings } from '@/components/settings/sonarr-settings'
import { RadarrSettings } from '@/components/settings/radarr-settings'
import { TraktSettings } from '@/components/settings/trakt-settings'
import { MediaSettings } from '@/components/settings/media-settings'
import { AiSettings } from '@/components/settings/ai-settings'
import { GeneralSettings } from '@/components/settings/general-settings'
import { type SettingsForm, settingsSchema } from '@/lib/types'
import { client, settingsQueryOptions } from '@/lib/api'

export const Route = createFileRoute('/settings')({
    component: Settings,
})

function Settings() {
    const { data: initialSettings, isPending } = useQuery(settingsQueryOptions);

    if (isPending) {
        return <div className="p-8">Loading settings...</div>;
    }

    return <InnerForm key={initialSettings ? 'loaded' : 'empty'} initialValues={initialSettings} />
}


function InnerForm({ initialValues }: { initialValues: any }) {
    const queryClient = useQueryClient();
    const { mutate: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (values: SettingsForm) => {
            const res = await client.api.settings.$post({ json: values });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        },
        onSuccess: (data) => {
            alert("Settings saved!");
            queryClient.setQueryData(['settings'], data);
        }
    });

    const form: any = useForm({
        defaultValues: {
            sonarrUrl: initialValues?.sonarrUrl || '',
            sonarrApiKey: initialValues?.sonarrApiKey || '',
            radarrUrl: initialValues?.radarrUrl || '',
            radarrApiKey: initialValues?.radarrApiKey || '',
            traktClientId: initialValues?.traktClientId || '',
            traktClientSecret: initialValues?.traktClientSecret || '',
            tmdbApiKey: initialValues?.tmdbApiKey || '',
            openaiApiKey: initialValues?.openaiApiKey || '',
            openaiBaseUrl: initialValues?.openaiBaseUrl || '',
            openaiModel: initialValues?.openaiModel || '',
            posterSource: initialValues?.posterSource || '',
        } as SettingsForm,
        validators: {
            onChange: settingsSchema
        },
        onSubmit: async ({ value }) => {
            await saveSettings(value);
        },
    })

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-2xl">Settings</CardTitle>
                    <CardDescription>Configure your specific services.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <form
                        onSubmit={(e) => {
                            console.log("-----")
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-4"
                    >
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="ai">AI Settings</TabsTrigger>
                                <TabsTrigger value="media">Media Services</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="mt-4">
                                <GeneralSettings form={form} />
                            </TabsContent>

                            <TabsContent value="ai" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>AI Configuration</CardTitle>
                                        <CardDescription>Configure OpenAI or compatible LLM settings.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AiSettings form={form} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="media" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Library Management</CardTitle>
                                        <CardDescription>Connect to your Sonarr and Radarr instances.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <SonarrSettings form={form} />
                                        <Separator />
                                        <RadarrSettings form={form} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Watch History</CardTitle>
                                        <CardDescription>Sync your watch history with Trakt.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <TraktSettings form={form} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Metadata</CardTitle>
                                        <CardDescription>Configure metadata providers like TMDB.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <MediaSettings form={form} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
