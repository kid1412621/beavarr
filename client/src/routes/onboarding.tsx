
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SonarrSettings } from '@/components/settings/sonarr-settings'
import { RadarrSettings } from '@/components/settings/radarr-settings'
import { TraktSettings } from '@/components/settings/trakt-settings'
import { MediaSettings } from '@/components/settings/media-settings'
import { AiSettings } from '@/components/settings/ai-settings'
import { type SettingsForm, settingsSchema } from '@/lib/types'
import { client, settingsQueryOptions } from '@/lib/api'

export const Route = createFileRoute('/onboarding')({
    component: Onboarding,
})

function Onboarding() {
    const { data: initialSettings, isPending } = useQuery(settingsQueryOptions);

    if (isPending) {
        return <div className="p-8">Loading...</div>;
    }

    return <InnerForm key={initialSettings ? 'loaded' : 'empty'} initialValues={initialSettings} />
}

function InnerForm({ initialValues }: { initialValues: any }) {
    const navigate = useNavigate({ from: '/onboarding' });
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
            navigate({ to: '/' });
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
                    <CardTitle>Welcome to Beavarr!</CardTitle>
                    <CardDescription>Let's get you set up. Please configure your services below. You can change these settings later.</CardDescription>
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
                        <AiSettings form={form} />
                        <hr />
                        <SonarrSettings form={form} />
                        <RadarrSettings form={form} />
                        <TraktSettings form={form} />
                        <MediaSettings form={form} />

                        <div className="pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save and Continue'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
