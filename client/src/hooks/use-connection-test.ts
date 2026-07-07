import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type ConnectableService, type SettingsForm } from '@/lib/types';

export type ConnectionStatus = 'idle' | 'testing' | 'success' | 'failed';

/** Metadata returned by the server on a successful connection test. */
export interface ConnectionMeta {
    serverName?: string;
    version?: string;
}

interface UseConnectionTestOptions {
    serviceType: ConnectableService;
    urlName?: keyof SettingsForm;
    apiKeyName: keyof SettingsForm;
    invalidateKeys?: string[][];
    statusQueryKey?: string[];
    statusQueryFn?: () => Promise<{
        connected: boolean;
        version?: string;
        serverName?: string;
    }>;
    onSuccess?: (meta: ConnectionMeta) => void;
    onFailure?: () => void;
}

export function useConnectionTest({
    serviceType,
    urlName,
    apiKeyName,
    invalidateKeys = [['settings']],
    statusQueryKey,
    statusQueryFn,
    onSuccess,
    onFailure,
}: UseConnectionTestOptions) {
    const form = useAppFormContext<SettingsForm>();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [meta, setMeta] = useState<ConnectionMeta>({});
    const [error, setError] = useState<string | undefined>(undefined);

    const { data: initialStatus } = useQuery({
        queryKey: statusQueryKey ?? [],
        queryFn: statusQueryFn!,
        enabled: !!statusQueryKey && !!statusQueryFn,
    });

    useEffect(() => {
        if (initialStatus?.connected) {
            setStatus('success');
            setMeta({
                version: initialStatus.version,
                serverName: initialStatus.serverName,
            });
        }
    }, [
        initialStatus?.connected,
        initialStatus?.version,
        initialStatus?.serverName,
    ]);

    const testConnection = async () => {
        const url = urlName
            ? (form.getFieldValue(urlName) as string | undefined)
            : undefined;
        const apiKey = form.getFieldValue(apiKeyName) as string | undefined;
        if ((urlName && !url) || !apiKey) return;

        setStatus('testing');
        setMeta({});
        setError(undefined);

        try {
            const res = await client.api.settings['test-connection'].$post({
                json: { type: serviceType, url: url || undefined, apiKey },
            });
            const data = (await res.json()) as {
                success: boolean;
                serverName?: string;
                version?: string;
                error?: string;
            };

            if (data.success) {
                const newMeta: ConnectionMeta = {
                    serverName: data.serverName,
                    version: data.version,
                };
                setStatus('success');
                setMeta(newMeta);
                onSuccess?.(newMeta);

                try {
                    const savePayload: any = { [apiKeyName]: apiKey };
                    if (urlName && url) {
                        savePayload[urlName] = url;
                    }
                    await client.api.settings.$post({
                        json: savePayload,
                    });
                    for (const key of invalidateKeys) {
                        queryClient.invalidateQueries({ queryKey: key });
                    }
                    if (statusQueryKey) {
                        queryClient.invalidateQueries({
                            queryKey: statusQueryKey,
                        });
                    }
                } catch (saveErr) {
                    console.error('Failed to auto-save settings:', saveErr);
                }
            } else {
                setStatus('failed');
                setError(data.error || 'unknown');
                onFailure?.();
            }
        } catch (err) {
            console.error('Failed to test connection:', err);
            setStatus('failed');
            setError('network');
            onFailure?.();
        }
    };

    return { status, setStatus, meta, error, testConnection };
}
