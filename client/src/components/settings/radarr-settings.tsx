import { useConnectionTest } from '@/hooks/use-connection-test';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import {
    ConnectableFields,
    ConnectableHeader,
} from './connectable-settings';

export function RadarrSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        meta,
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
            return res.json();
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
                <div className="space-y-4">
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
                            <span className="font-medium">Connect Radarr</span>. You can
                            find the API key in Radarr under{' '}
                            <span className="font-medium">
                                Settings → General → Security
                            </span>
                            .
                        </p>
                    )}

                    {testStatus === 'failed' && (
                        <p className="text-sm text-red-500">
                            Could not connect to Radarr. Check the URL and API key and try
                            again.
                        </p>
                    )}
                </div>
            )}
        </form.Subscribe>
    );
}
