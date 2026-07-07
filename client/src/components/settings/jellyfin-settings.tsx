import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnectionTest } from '@/hooks/use-connection-test';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { ConnectableFields, ConnectableHeader } from './connectable-settings';

export function JellyfinSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        meta,
        error: testError,
        testConnection,
    } = useConnectionTest({
        serviceType: 'jellyfin',
        urlName: 'jellyfinUrl',
        apiKeyName: 'jellyfinApiKey',
        invalidateKeys: [['settings'], ['jellyfin-status']],
        statusQueryKey: ['jellyfin-status'],
        statusQueryFn: async () => {
            const res = await client.api.jellyfin.status.$get();
            if (!res.ok) return { connected: false };
            return await res.json();
        },
    });

    return (
        <form.Subscribe
            selector={(state) => [
                state.values.jellyfinUrl,
                state.values.jellyfinApiKey,
            ]}
        >
            {([jellyfinUrl, jellyfinApiKey]) => (
                <div className="flex flex-col gap-4">
                    <ConnectableHeader
                        title="Jellyfin"
                        serviceName="Jellyfin"
                        status={testStatus}
                        version={meta.version}
                        onConnect={testConnection}
                        disabled={!jellyfinUrl || !jellyfinApiKey}
                    />

                    <ConnectableFields
                        urlName="jellyfinUrl"
                        apiKeyName="jellyfinApiKey"
                        serviceName="Jellyfin"
                        urlPlaceholder="http://your-jellyfin:8096"
                        apiKeyHelperUrl={
                            jellyfinUrl
                                ? `${jellyfinUrl.replace(/\/$/, '')}/web/index.html#/dashboard/keys`
                                : undefined
                        }
                        onResetStatus={() => setTestStatus('idle')}
                    />

                    {testStatus === 'idle' && (
                        <p className="text-muted-foreground text-sm">
                            Enter your Jellyfin server URL and API key, then
                            click{' '}
                            <span className="font-medium">
                                Connect Jellyfin
                            </span>
                            . You can create an API key in your Jellyfin
                            dashboard under{' '}
                            <span className="font-medium">
                                Administration → API Keys
                            </span>
                            .
                        </p>
                    )}

                    {testStatus === 'failed' && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {testError === 'network'
                                    ? 'Could not connect to Jellyfin. Please check your network connection and the URL.'
                                    : testError === 'unauthorized' ||
                                        testError === 'forbidden'
                                      ? 'Could not connect to Jellyfin. Please check if the API key is correct and has sufficient permissions.'
                                      : 'Could not connect to Jellyfin. Check the URL and API key and try again.'}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </form.Subscribe>
    );
}
