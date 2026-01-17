import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { hcWithType } from 'server/dist/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation } from '@tanstack/react-query'
import { SonarrSettings } from '@/components/settings/sonarr-settings'
import { RadarrSettings } from '@/components/settings/radarr-settings'
import { TraktSettings } from '@/components/settings/trakt-settings'
import { MediaSettings } from '@/components/settings/media-settings'
import { AiSettings } from '@/components/settings/ai-settings'
import { type SettingsForm, settingsSchema } from '@/lib/types'

const SERVER_URL = import.meta.env.DEV ? "http://localhost:4242" : "/";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute('/settings')({
    component: Settings,
})

function Settings() {
    const { data: initialSettings, isPending } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await client.api.settings.$get();
            if (!res.ok) throw new Error('Failed to fetch settings');
            return await res.json();
        },
    });

    if (isPending) {
        return <div className="p-8">Loading settings...</div>;
    }

    return <InnerForm key={initialSettings ? 'loaded' : 'empty'} initialValues={initialSettings} />
}

function InnerForm({ initialValues }: { initialValues: any }) {
    const { mutate: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (values: SettingsForm) => {
            const res = await client.api.settings.$post({ json: values });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        },
        onSuccess: () => {
            alert("Settings saved!");
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
        } as SettingsForm,
        validators: {
            onChange: settingsSchema
        },
        onSubmit: async ({ value }) => {
            await saveSettings(value);
        },
    })

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Configure your *arr stack and AI integrations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-4"
                    >
                        <SonarrSettings form={form} />
                        <RadarrSettings form={form} />
                        <TraktSettings form={form} />
                        <MediaSettings form={form} />
                        <AiSettings form={form} />

                        <div className="pt-4">
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
