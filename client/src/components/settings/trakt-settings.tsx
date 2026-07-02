import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clipboard as ClipboardIcon, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { TraktDeviceCodeResponse } from 'shared';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
} from '@/components/ui/field';
import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { client } from '@/lib/api';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { ConnectableHeader, pasteFromClipboard } from './connectable-settings';

export function TraktSettings() {
    const form = useAppFormContext<SettingsForm>();
    const queryClient = useQueryClient();
    const [isConnecting, setIsConnecting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [deviceCodeInfo, setDeviceCodeInfo] =
        useState<TraktDeviceCodeResponse | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Query connection status
    const { data: status } = useQuery({
        queryKey: ['trakt-status'],
        queryFn: async () => {
            const res = await client.api.trakt.status.$get();
            if (!res.ok) throw new Error('Failed to fetch status');
            return await res.json();
        },
    });

    // Query auth mode
    const { data: authMode } = useQuery({
        queryKey: ['trakt-auth-mode'],
        queryFn: async () => {
            const res = await client.api.trakt['auth-mode'].$get();
            if (!res.ok) return { mode: 'device' };
            return await res.json();
        },
    });

    // Start device code flow
    const startDeviceCode = useMutation({
        mutationFn: async () => {
            const res = await client.api.trakt.device.code.$post();
            if (!res.ok)
                throw new Error('Failed to start device authorization');
            return await res.json();
        },
        onSuccess: (data) => {
            setDeviceCodeInfo(data);
            setTimeRemaining(data.expires_in);
            setIsConnecting(false);
        },
        onError: () => {
            setIsConnecting(false);
        },
    });

    // Poll for device authorization
    const [pollError, setPollError] = useState<string | null>(null);

    useEffect(() => {
        if (!deviceCodeInfo || status?.connected) return;

        const pollInterval = deviceCodeInfo.interval * 1000;
        let timeoutId: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                // Store device code in memory for polling
                const res = await client.api.trakt.device.poll.$post({
                    json: { device_code: deviceCodeInfo.device_code },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'authorized') {
                        queryClient.invalidateQueries({
                            queryKey: ['trakt-status'],
                        });
                        setDeviceCodeInfo(null);
                        return;
                    }
                }
                // Continue polling
                timeoutId = setTimeout(poll, pollInterval);
            } catch (err) {
                setPollError('Failed to poll for authorization');
                setDeviceCodeInfo(null);
                console.error(err);
            }
        };

        // Start polling after initial delay
        timeoutId = setTimeout(poll, pollInterval);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [deviceCodeInfo, status?.connected, queryClient]);

    // Countdown timer
    useEffect(() => {
        if (!deviceCodeInfo || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    // Expired, restart
                    setDeviceCodeInfo(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [deviceCodeInfo, timeRemaining]);

    const handleConnect = () => {
        setIsConnecting(true);
        setPollError(null);
        startDeviceCode.mutate();
    };

    const handleCancelDevice = () => {
        setDeviceCodeInfo(null);
        setIsConnecting(false);
        setTimeRemaining(0);
    };

    const handleDisconnect = useMutation({
        mutationFn: async () => {
            const endpoint =
                authMode?.mode === 'authorization_code'
                    ? 'disconnect'
                    : 'device';
            const res = await client.api.trakt[endpoint].$delete();
            if (!res.ok) throw new Error('Failed to disconnect');
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trakt-status'] });
            setDeviceCodeInfo(null);
        },
    });

    const isConnected = status?.connected;
    const isDeviceFlow = authMode?.mode !== 'authorization_code';

    // Query user info only when connected
    const { data: user } = useQuery({
        queryKey: ['trakt-user'],
        queryFn: async () => {
            const res = await client.api.trakt.user.$get();
            if (!res.ok) return null;
            return await res.json();
        },
        enabled: !!status?.connected,
    });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-4">
            <ConnectableHeader
                title="Trakt"
                serviceName="Trakt"
                status={
                    isConnected
                        ? 'success'
                        : isConnecting || startDeviceCode.isPending
                          ? 'testing'
                          : 'idle'
                }
                onConnect={handleConnect}
                disabled={isConnected || !!deviceCodeInfo}
                action={
                    isConnected ? (
                        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                            <div className="flex items-center gap-2">
                                {user?.avatar ? (
                                    <Avatar className="size-6">
                                        <AvatarImage
                                            src={`/api/trakt/avatar?url=${encodeURIComponent(user.avatar)}`}
                                            alt={user.name || user.username}
                                        />
                                        <AvatarFallback>
                                            {(user.name ||
                                                user.username)?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : null}
                                <span className="text-sm font-medium">
                                    {user?.name || user?.username}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisconnect.mutate()}
                                disabled={handleDisconnect.isPending}
                                className="w-full sm:w-auto"
                            >
                                {handleDisconnect.isPending && (
                                    <Spinner data-icon="inline-start" />
                                )}
                                {handleDisconnect.isPending
                                    ? 'Disconnecting...'
                                    : 'Disconnect'}
                            </Button>
                        </div>
                    ) : deviceCodeInfo ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelDevice}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    ) : null
                }
            >
                {isConnected && isDeviceFlow && (
                    <Badge variant="secondary">Device Flow</Badge>
                )}
            </ConnectableHeader>

            {/* Device Flow UI */}
            {!isConnected && deviceCodeInfo && (
                <div className="bg-muted/50 rounded-lg border p-4">
                    <div className="flex flex-col gap-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            Go to{' '}
                            <a
                                href={deviceCodeInfo.verification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary inline-flex items-center gap-1 hover:underline"
                            >
                                {deviceCodeInfo.verification_url}
                                <ExternalLink className="size-3.5" />
                            </a>
                        </p>
                        <div className="flex flex-col gap-2">
                            <p className="text-sm">Enter this code:</p>
                            <div className="flex items-center justify-center gap-2">
                                <div className="text-primary font-mono text-3xl font-bold tracking-wider">
                                    {deviceCodeInfo.user_code}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            deviceCodeInfo.user_code,
                                        )
                                    }
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Copy to clipboard"
                                >
                                    <ClipboardIcon data-icon="inline-start" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                            <Spinner />
                            <span>
                                Time remaining: {formatTime(timeRemaining)}
                            </span>
                        </div>
                        {pollError && (
                            <Alert variant="destructive">
                                <AlertDescription>{pollError}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Toggle */}
            {!isConnected && (
                <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-muted-foreground hover:text-foreground h-auto self-start p-0 text-sm"
                >
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                </Button>
            )}

            {/* Advanced: Custom Credentials */}
            {showAdvanced && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Authorization Code Flow</h4>
                        <p className="text-muted-foreground text-xs">
                            For advanced users with custom Trakt app
                            credentials.{' '}
                            <a
                                href="https://trakt.tv/oauth/applications"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground underline"
                            >
                                Create your app here
                            </a>
                        </p>
                    </div>
                    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <form.AppField
                            name="traktClientId"
                            children={(field) => {
                                const hasError = !!(
                                    field.state.meta.errors &&
                                    field.state.meta.errors.length > 0
                                );
                                return (
                                    <Field data-invalid={hasError}>
                                        <FieldLabel htmlFor={field.name}>
                                            Trakt Client ID
                                        </FieldLabel>
                                        <InputGroup>
                                            <InputGroupInput
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                aria-invalid={hasError}
                                            />
                                            <InputGroupAddon>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        pasteFromClipboard(
                                                            field,
                                                        )
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
                        <form.AppField
                            name="traktClientSecret"
                            children={(field) => {
                                const hasError = !!(
                                    field.state.meta.errors &&
                                    field.state.meta.errors.length > 0
                                );
                                return (
                                    <Field data-invalid={hasError}>
                                        <FieldLabel htmlFor={field.name}>
                                            Trakt Client Secret
                                        </FieldLabel>
                                        <InputGroup>
                                            <InputGroupInput
                                                id={field.name}
                                                name={field.name}
                                                type="password"
                                                value={field.state.value || ''}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                aria-invalid={hasError}
                                            />
                                            <InputGroupAddon>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        pasteFromClipboard(
                                                            field,
                                                        )
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
                    </FieldGroup>
                </div>
            )}

            {/* Help Text */}
            {!isConnected && !deviceCodeInfo && (
                <p className="text-muted-foreground text-sm">
                    {isDeviceFlow
                        ? 'Click "Connect Trakt" to start the device authorization flow.'
                        : 'Enter your Trakt API credentials and save to use Authorization Code Flow.'}
                </p>
            )}
        </div>
    );
}
