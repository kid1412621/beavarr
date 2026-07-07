import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnectionTest } from '@/hooks/use-connection-test';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm, type ServiceStatusResponse } from '@/lib/types';

import { ConnectableFields, ConnectableHeader } from './connectable-settings';

export function RadarrSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        meta,
        error: testError,
        testConnection,
    } = useConnectionTest({
        serviceType: 'radarr',
        urlName: 'radarrUrl',
        apiKeyName: 'radarrApiKey',
        statusQueryKey: ['radarr-status'],
        statusQueryFn: async () => {
            const res = await client.api.settings.status.$get({
                query: { service: 'radarr' },
            });
            if (!res.ok) return { connected: false };
            return res.json() as Promise<ServiceStatusResponse>;
        },
    });

    return (
        <form.Subscribe
            selector={(state) => [
                state.values.radarrUrl,
                state.values.radarrApiKey,
            ]}
        >
            {([radarrUrl, radarrApiKey]) => (
                <div className="flex flex-col gap-4">
                    <ConnectableHeader
                        title="Radarr"
                        serviceName="Radarr"
                        status={testStatus}
                        version={meta.version}
                        onConnect={testConnection}
                        disabled={!radarrUrl || !radarrApiKey}
                    />

                    <ConnectableFields
                        serviceName="Radarr"
                        urlName="radarrUrl"
                        apiKeyName="radarrApiKey"
                        urlPlaceholder="http://localhost:7878"
                        apiKeyHelperUrl={
                            radarrUrl
                                ? `${radarrUrl.replace(/\/$/, '')}/settings/general`
                                : undefined
                        }
                        onResetStatus={() => setTestStatus('idle')}
                    />

                    {testStatus === 'idle' && (
                        <p className="text-muted-foreground text-sm">
                            Enter your Radarr URL and API key, then click{' '}
                            <span className="font-medium">Connect Radarr</span>.
                            You can find the API key in Radarr under{' '}
                            <span className="font-medium">
                                Settings → General → Security
                            </span>
                            .
                        </p>
                    )}

                    {testStatus === 'failed' && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {testError === 'network'
                                    ? 'Could not connect to Radarr. Please check your network connection and the URL.'
                                    : testError === 'unauthorized' ||
                                        testError === 'forbidden'
                                      ? 'Could not connect to Radarr. Please check if the API key is correct and has sufficient permissions.'
                                      : 'Could not connect to Radarr. Check the URL and API key and try again.'}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </form.Subscribe>
    );
}
