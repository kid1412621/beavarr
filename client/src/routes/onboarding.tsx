import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
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
    const [step, setStep] = useState(1);

    const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (values: SettingsForm) => {
            const res = await client.api.settings.$post({ json: values });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        },
        onSuccess: (data) => {
            // Only navigate away if we are finishing the last step
            if (step === 2) {
                alert("Settings saved!");
                queryClient.setQueryData(['settings'], data);
                navigate({ to: '/' });
            }
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
            posterSource: initialValues?.posterSource,
        } as SettingsForm,
        validators: {
            onChange: settingsSchema
        },
        onSubmit: async ({ value }) => {
            if (!form.state.isDirty) {
                navigate({ to: '/' });
                return;
            }
            await saveSettings(value);
        },
    })

    const handleNext = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            // Save current state before moving to next step only if dirty
            if (form.state.isDirty) {
                await saveSettings(form.state.values);
            }
            setStep(2);
        } catch (error) {
            console.error("Failed to save step 1", error);
            alert("Failed to save settings");
        }
    };

    const handleBack = () => {
        setStep(1);
    }

    return (
        <div className="p-4 max-w-2xl mx-auto h-screen flex items-center justify-center">
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                    <CardTitle>
                        {step === 1 ? 'Configure Intelligence' : 'Connect Services'}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? 'Set up your AI provider to enable smart features.'
                            : 'Connect your media library and metadata services.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                        className="space-y-6"
                    >
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Alert className="bg-muted/50 border-none">
                                    <AlertDescription>
                                        We currently support OpenAI and compatible providers (like LocalAI, Ollama).
                                    </AlertDescription>
                                </Alert>
                                <AiSettings form={form} />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Library</h3>
                                    <SonarrSettings form={form} />
                                    <RadarrSettings form={form} />
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">History & Metadata</h3>
                                    <TraktSettings form={form} />
                                    <MediaSettings form={form} />
                                </div>
                            </div>
                        )}

                        <div className="pt-6 flex justify-between">
                            {step === 2 ? (
                                <Button type="button" variant="outline" onClick={handleBack} disabled={isSaving}>
                                    Back
                                </Button>
                            ) : (
                                <Button type="button" variant="ghost" onClick={() => navigate({ to: '/' })}>
                                    Skip Setup
                                </Button>
                            )}

                            {step === 1 ? (
                                <Button type="button" onClick={handleNext}>
                                    Next: Services
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Finishing...' : 'Complete Setup'}
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
