import { Clipboard as ClipboardIcon, ExternalLink } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { useConnectionTest } from '@/hooks/use-connection-test';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm, type ServiceStatusResponse } from '@/lib/types';

import { ConnectableHeader, pasteFromClipboard } from './connectable-settings';

interface MetadataServiceSettingsProps {
    title: string;
    serviceType: 'tmdb' | 'tvdb' | 'omdb';
    apiKeyName: 'tmdbApiKey' | 'tvdbApiKey' | 'omdbApiKey';
    docLink: string;
}

function MetadataServiceSettings({
    title,
    serviceType,
    apiKeyName,
    docLink,
}: MetadataServiceSettingsProps) {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        error: testError,
        testConnection,
    } = useConnectionTest({
        serviceType,
        apiKeyName,
        statusQueryKey: [`${serviceType}-status`],
        statusQueryFn: async () => {
            const res = await client.api.settings.status.$get({
                query: { service: serviceType },
            });
            if (!res.ok) return { connected: false };
            return res.json() as Promise<ServiceStatusResponse>;
        },
    });

    return (
        <form.Subscribe selector={(state) => [state.values[apiKeyName]]}>
            {([apiKey]) => (
                <div className="flex flex-col gap-3">
                    <ConnectableHeader
                        title={title}
                        serviceName={title}
                        status={testStatus}
                        onConnect={testConnection}
                        disabled={!apiKey}
                    />

                    <form.AppField
                        name={apiKeyName}
                        children={(field) => {
                            const hasError = !!(
                                field.state.meta.errors &&
                                field.state.meta.errors.length > 0
                            );
                            return (
                                <Field data-invalid={hasError}>
                                    <FieldLabel htmlFor={field.name}>
                                        {title} API Key
                                    </FieldLabel>
                                    <InputGroup>
                                        <InputGroupInput
                                            id={field.name}
                                            name={field.name}
                                            type="password"
                                            value={field.state.value || ''}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(
                                                    e.target.value,
                                                );
                                                setTestStatus('idle');
                                            }}
                                            aria-invalid={hasError}
                                        />
                                        <InputGroupAddon>
                                            <a
                                                href={docLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground flex items-center justify-center p-2"
                                                title={`Get ${title} API Key`}
                                            >
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    pasteFromClipboard(field)
                                                }
                                                title="Paste from clipboard"
                                            >
                                                <ClipboardIcon data-icon="inline-start" />
                                            </Button>
                                        </InputGroupAddon>
                                    </InputGroup>
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

                    {testStatus === 'idle' && (
                        <p className="text-muted-foreground text-sm">
                            Enter your {title} API Key, then click{' '}
                            <span className="font-medium">Connect {title}</span>
                            .{' '}
                            {docLink && (
                                <>
                                    You can get one from the{' '}
                                    <a
                                        href={docLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary inline-flex items-center gap-0.5 hover:underline"
                                    >
                                        {title} website
                                    </a>
                                    .
                                </>
                            )}
                        </p>
                    )}

                    {testStatus === 'failed' && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {testError === 'network'
                                    ? `Could not connect to ${title}. Please check your network connection.`
                                    : testError === 'unauthorized' ||
                                        testError === 'forbidden'
                                      ? `Could not connect to ${title}. Please check if the API key is correct and has sufficient permissions.`
                                      : `Could not connect to ${title}. Check your API Key and try again.`}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </form.Subscribe>
    );
}

export function MediaSettings() {
    return (
        <div className="flex flex-col gap-6">
            <MetadataServiceSettings
                title="TMDB"
                serviceType="tmdb"
                apiKeyName="tmdbApiKey"
                docLink="https://www.themoviedb.org/settings/api"
            />
            <Separator />
            <MetadataServiceSettings
                title="TVDB"
                serviceType="tvdb"
                apiKeyName="tvdbApiKey"
                docLink="https://thetvdb.com/dashboard/account/apikey"
            />
            <Separator />
            <MetadataServiceSettings
                title="OMDB"
                serviceType="omdb"
                apiKeyName="omdbApiKey"
                docLink="http://www.omdbapi.com/apikey.aspx"
            />
        </div>
    );
}
