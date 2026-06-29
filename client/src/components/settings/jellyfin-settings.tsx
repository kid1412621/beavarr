import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import {
    ConnectableFields,
    ConnectableHeader,
} from './connectable-settings';

export function JellyfinSettings() {
    const form = useAppFormContext<SettingsForm>();
    const [serverInfo, setServerInfo] = useState<{
        serverName?: string;
        version?: string;
    } | null>(null);

    const { status, setStatus, testConnection } = useJellyfinTest(
        form,
        setServerInfo,
    );

    const { data: jellyfinStatus } = useQuery({
        queryKey: ['jellyfin-status'],
        queryFn: async () => {
            const res = await client.api.jellyfin.status.$get();
            if (!res.ok) return { connected: false };
            return await res.json();
        },
    });

    const isConnected = jellyfinStatus?.connected;
    const displayStatus = isConnected ? 'success' : status;

    return (
        <div className="space-y-4">
            <ConnectableHeader
                title="Jellyfin"
                serviceName="Jellyfin"
                status={displayStatus}
                onConnect={testConnection}
                disabled={false}
                action={
                    isConnected ? (
                        <div className="flex items-center gap-3">
                            {jellyfinStatus?.serverName && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">
                                        {jellyfinStatus.serverName}
                                    </span>
                                    {jellyfinStatus?.version && (
                                        <span className="text-muted-foreground ml-1 text-xs">
                                            v{jellyfinStatus.version}
                                        </span>
                                    )}
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={testConnection}
                                disabled={status === 'testing'}
                            >
                                {status === 'testing' ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </div>
                    ) : undefined
                }
            >
                {isConnected && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Self-hosted
                    </span>
                )}
            </ConnectableHeader>

            {/* Server info after successful test */}
            {status === 'success' && !isConnected && serverInfo?.serverName && (
                <p className="text-muted-foreground text-sm">
                    Connected to{' '}
                    <span className="text-foreground font-medium">
                        {serverInfo.serverName}
                    </span>
                    {serverInfo.version && (
                        <span className="ml-1 text-xs">v{serverInfo.version}</span>
                    )}
                </p>
            )}

            <ConnectableFields
                urlName="jellyfinUrl"
                apiKeyName="jellyfinApiKey"
                serviceName="Jellyfin"
                urlPlaceholder="http://your-jellyfin:8096"
                apiKeyHelperUrl={
                    form.getFieldValue('jellyfinUrl')
                        ? `${form.getFieldValue('jellyfinUrl')}/web/index.html#!/apikeys.html`
                        : undefined
                }
                onResetStatus={() => {
                    setStatus('idle');
                    setServerInfo(null);
                }}
            />

            {!isConnected && status === 'idle' && (
                <p className="text-muted-foreground text-sm">
                    Enter your Jellyfin server URL and API key, then click{' '}
                    <span className="font-medium">Connect Jellyfin</span>. You can
                    create an API key in your Jellyfin dashboard under{' '}
                    <span className="font-medium">
                        Administration → API Keys
                    </span>
                    .
                </p>
            )}

            {status === 'failed' && (
                <p className="text-sm text-red-500">
                    Could not connect to Jellyfin. Check the URL and API key and try
                    again.
                </p>
            )}
        </div>
    );
}

/**
 * Custom hook for Jellyfin connection test that also captures server info.
 */
function useJellyfinTest(
    form: ReturnType<typeof useAppFormContext<SettingsForm>>,
    onServerInfo: (info: { serverName?: string; version?: string } | null) => void,
) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<
        'idle' | 'testing' | 'success' | 'failed'
    >('idle');

    const testConnection = async () => {
        const url = form.getFieldValue('jellyfinUrl');
        const apiKey = form.getFieldValue('jellyfinApiKey');
        if (!url || !apiKey) return;

        setStatus('testing');
        onServerInfo(null);

        try {
            const res = await client.api.settings['test-connection'].$post({
                json: { type: 'jellyfin', url, apiKey },
            });
            const data = await res.json() as {
                success: boolean;
                serverName?: string;
                version?: string;
            };

            if (data.success) {
                setStatus('success');
                onServerInfo({
                    serverName: data.serverName,
                    version: data.version,
                });
                // Auto-save the settings
                try {
                    await client.api.settings.$post({
                        json: { jellyfinUrl: url, jellyfinApiKey: apiKey } as any,
                    });
                    queryClient.invalidateQueries({ queryKey: ['settings'] });
                    queryClient.invalidateQueries({ queryKey: ['jellyfin-status'] });
                } catch {
                    // non-critical
                }
            } else {
                setStatus('failed');
            }
        } catch {
            setStatus('failed');
        }
    };

    return { status, setStatus, testConnection };
}
