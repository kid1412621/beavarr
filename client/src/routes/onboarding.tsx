import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { AiSettings } from '@/components/settings/ai-settings';
import { GeneralSettings } from '@/components/settings/general-settings';
import { MediaSettings } from '@/components/settings/media-settings';
import { RadarrSettings } from '@/components/settings/radarr-settings';
import { SonarrSettings } from '@/components/settings/sonarr-settings';
import { TraktSettings } from '@/components/settings/trakt-settings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { client, settingsQueryOptions } from '@/lib/api';
import { useAppForm } from '@/lib/form';
import { type SettingsForm, settingsSchema } from '@/lib/types';

const onboardingSearchSchema = z.object({
    step: z.number().catch(1),
});

export const Route = createFileRoute('/onboarding')({
    component: Onboarding,
    validateSearch: onboardingSearchSchema,
});

function Onboarding() {
    const { data: initialSettings, isPending } = useQuery(settingsQueryOptions);

    if (isPending) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <InnerForm
            key={initialSettings ? 'loaded' : 'empty'}
            initialValues={initialSettings}
        />
    );
}

function InnerForm({ initialValues }: { initialValues: any }) {
    const navigate = useNavigate({ from: '/onboarding' });
    const { step } = Route.useSearch();
    const queryClient = useQueryClient();

    const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (values: SettingsForm) => {
            const res = await client.api.settings.$post({ json: values });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        },
        onSuccess: (data) => {
            // Only navigate away if we are finishing the last step
            if (step === 2) {
                toast.success('Settings saved!');
                queryClient.setQueryData(['settings'], data);
                navigate({ to: '/' });
            }
        },
    });

    const form = useAppForm({
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
            onChange: settingsSchema,
        },
        onSubmit: async ({ value }) => {
            if (!form.state.isDirty) {
                navigate({ to: '/' });
                return;
            }
            await saveSettings(value);
        },
    });

    const handleNext = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            // Save current state before moving to next step only if dirty
            if (form.state.isDirty) {
                await saveSettings(form.state.values);
            }
            navigate({ search: (old) => ({ ...old, step: 2 }) });
        } catch (error) {
            console.error('Failed to save step 1', error);
            toast.error('Failed to save settings');
        }
    };

    const handleBack = () => {
        navigate({ search: (old) => ({ ...old, step: 1 }) });
    };

    return (
        <div className="mx-auto flex min-h-screen max-w-2xl items-start justify-center p-4 md:py-12">
            <Card className="w-full">
                <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                        <div
                            className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}
                        />
                        <div
                            className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}
                        />
                    </div>
                    <CardTitle>
                        {step === 1
                            ? 'Configure Intelligence'
                            : 'Connect Services'}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? 'Set up your AI provider to enable smart features.'
                            : 'Connect your media library and metadata services.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form.AppForm>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                            className="space-y-6"
                        >
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300">
                                    <Alert className="bg-muted/50 border-none">
                                        <AlertDescription>
                                            We currently support OpenAI and
                                            compatible providers (like LocalAI,
                                            Ollama).
                                        </AlertDescription>
                                    </Alert>
                                    <AiSettings />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                                    <div className="space-y-4">
                                        <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                                            Library
                                        </h3>
                                        <SonarrSettings />
                                        <RadarrSettings />
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                                            General
                                        </h3>
                                        <GeneralSettings />
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                                            History & Metadata
                                        </h3>
                                        <TraktSettings />
                                        <MediaSettings />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-6">
                                {step === 2 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={isSaving}
                                    >
                                        Back
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate({ to: '/' })}
                                    >
                                        Skip Setup
                                    </Button>
                                )}

                                {step === 1 ? (
                                    <Button type="button" onClick={handleNext}>
                                        Next: Services
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                        >
                                            {isSaving
                                                ? 'Finishing...'
                                                : 'Complete Setup'}
                                        </Button>
                                        <form.Subscribe
                                            selector={(state: any) =>
                                                state.errors
                                            }
                                            children={(errors: any) => (
                                                <>
                                                    {errors.length > 0 && (
                                                        <p className="text-destructive text-xs font-medium">
                                                            {errors[0]
                                                                ?.message ||
                                                                'Please fix errors above'}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </form>
                    </form.AppForm>
                </CardContent>
            </Card>
        </div>
    );
}
