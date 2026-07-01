import { useConnectionTest } from '@/hooks/use-connection-test';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { ConnectableFields, ConnectableHeader } from './connectable-settings';

export function SonarrSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        meta,
        testConnection,
    } = useConnectionTest({
        serviceType: 'sonarr',
        urlName: 'sonarrUrl',
        apiKeyName: 'sonarrApiKey',
        statusQueryKey: ['sonarr-status'],
        statusQueryFn: async () => {
            const res = await client.api.settings.status.$get({
                query: { service: 'sonarr' },
            });
            if (!res.ok) return { connected: false };
            return res.json();
        },
    });

    return (
        <form.Subscribe
            selector={(state) => [
                state.values.sonarrUrl,
                state.values.sonarrApiKey,
            ]}
        >
            {([sonarrUrl, sonarrApiKey]) => (
                <div className="space-y-4">
                    <ConnectableHeader
                        title="Sonarr"
                        serviceName="Sonarr"
                        status={testStatus}
                        version={meta.version}
                        onConnect={testConnection}
                        disabled={!sonarrUrl || !sonarrApiKey}
                    />

                    <ConnectableFields
                        serviceName="Sonarr"
                        urlName="sonarrUrl"
                        apiKeyName="sonarrApiKey"
                        urlPlaceholder="http://localhost:8989"
                        apiKeyHelperUrl={
                            sonarrUrl
                                ? `${sonarrUrl.replace(/\/$/, '')}/settings/general`
                                : undefined
                        }
                        onResetStatus={() => setTestStatus('idle')}
                    />

                    {testStatus === 'idle' && (
                        <p className="text-muted-foreground text-sm">
                            Enter your Sonarr URL and API key, then click{' '}
                            <span className="font-medium">Connect Sonarr</span>.
                            You can find the API key in Sonarr under{' '}
                            <span className="font-medium">
                                Settings → General → Security
                            </span>
                            .
                        </p>
                    )}

                    {testStatus === 'failed' && (
                        <p className="text-sm text-red-500">
                            Could not connect to Sonarr. Check the URL and API
                            key and try again.
                        </p>
                    )}
                </div>
            )}
        </form.Subscribe>
    );
}
