
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Clipboard, ExternalLink, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hcWithType } from 'server/dist/client'
import { useState, useEffect } from 'react'

const SERVER_URL = import.meta.env.DEV ? "http://localhost:4242" : "/";
const client = hcWithType(SERVER_URL);

interface DeviceCodeInfo {
    device_code: string;
    user_code: string;
    verification_url: string;
    expires_in: number;
    interval: number;
}

export function TraktSettings({ form }: { form: any }) {
    const queryClient = useQueryClient();
    const [isConnecting, setIsConnecting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [deviceCodeInfo, setDeviceCodeInfo] = useState<DeviceCodeInfo | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Query connection status
    const { data: status } = useQuery({
        queryKey: ['trakt-status'],
        queryFn: async () => {
            const res = await (client.api as any).trakt.status.$get();
            if (!res.ok) throw new Error('Failed to fetch status');
            return await res.json();
        },
    });

    // Query auth mode
    const { data: authMode } = useQuery({
        queryKey: ['trakt-auth-mode'],
        queryFn: async () => {
            const res = await (client.api as any).trakt['auth-mode'].$get();
            if (!res.ok) return { mode: 'device' };
            return await res.json();
        },
    });

    // Start device code flow
    const startDeviceCode = useMutation({
        mutationFn: async () => {
            const res = await (client.api as any).trakt['device/code'].$post();
            if (!res.ok) throw new Error('Failed to start device authorization');
            return await res.json() as DeviceCodeInfo;
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
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            try {
                // Store device code in memory for polling
                const res = await (client.api as any).trakt['device/poll'].$post({
                    json: { device_code: deviceCodeInfo.device_code }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'authorized') {
                        queryClient.invalidateQueries({ queryKey: ['trakt-status'] });
                        setDeviceCodeInfo(null);
                        return;
                    }
                }
                // Continue polling
                timeoutId = setTimeout(poll, pollInterval);
            } catch (err) {
                setPollError('Failed to poll for authorization');
                setDeviceCodeInfo(null);
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
            const endpoint = authMode?.mode === 'authorization_code' ? 'disconnect' : 'device';
            const res = await (client.api as any).trakt[endpoint].$delete();
            if (!res.ok) throw new Error('Failed to disconnect');
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trakt-status'] });
            setDeviceCodeInfo(null);
        },
    });

    const pasteFromClipboard = async (field: any) => {
        try {
            const text = await navigator.clipboard.readText()
            field.handleChange(text)
        } catch (err) {
            console.error('Failed to read clipboard', err)
        }
    }

    const isConnected = status?.connected;
    const isDeviceFlow = authMode?.mode !== 'authorization_code';

    // Query user info only when connected
    const { data: user } = useQuery({
        queryKey: ['trakt-user'],
        queryFn: async () => {
            const res = await (client.api as any).trakt.user.$get();
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Trakt</h3>
                    {isConnected && isDeviceFlow && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            Device Flow
                        </span>
                    )}
                </div>
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        {user?.avatar ? (
                            <img
                                src={`/api/trakt/avatar?url=${encodeURIComponent(user.avatar)}`}
                                alt={user.name || user.username}
                                className="w-6 h-6 rounded-full"
                            />
                        ) : null}
                        <span className="text-sm text-green-600">{user?.name || user?.username}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect.mutate()}
                            disabled={handleDisconnect.isPending}
                        >
                            {handleDisconnect.isPending ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                    </div>
                ) : deviceCodeInfo ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelDevice}
                    >
                        Cancel
                    </Button>
                ) : (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnect}
                        disabled={isConnecting || startDeviceCode.isPending}
                    >
                        {isConnecting || startDeviceCode.isPending ? 'Connecting...' : 'Connect Trakt'}
                    </Button>
                )}
            </div>

            {/* Device Flow UI */}
            {!isConnected && deviceCodeInfo && (
                <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Go to{' '}
                            <a
                                href={deviceCodeInfo.verification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                                {deviceCodeInfo.verification_url}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm">Enter this code:</p>
                            <div className="flex items-center justify-center gap-2">
                                <div className="text-3xl font-mono font-bold tracking-wider text-primary">
                                    {deviceCodeInfo.user_code}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(deviceCodeInfo.user_code)}
                                    className="text-muted-foreground hover:text-foreground p-1"
                                    title="Copy to clipboard"
                                >
                                    <Clipboard className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>
                                Time remaining: {formatTime(timeRemaining)}
                            </span>
                        </div>
                        {pollError && (
                            <p className="text-sm text-red-500">{pollError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Toggle */}
            {!isConnected && (
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>
            )}

            {/* Advanced: Custom Credentials */}
            {showAdvanced && (
                <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Authorization Code Flow</h4>
                        <p className="text-xs text-muted-foreground">
                            For advanced users with custom Trakt app credentials
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="traktClientId"
                            children={(field: any) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Trakt Client ID</Label>
                                    <div className="relative">
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => pasteFromClipboard(field)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            title="Paste from clipboard"
                                        >
                                            <Clipboard className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                        <form.Field
                            name="traktClientSecret"
                            children={(field: any) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Trakt Client Secret</Label>
                                    <div className="relative">
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="password"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => pasteFromClipboard(field)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            title="Paste from clipboard"
                                        >
                                            <Clipboard className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Help Text */}
            {!isConnected && !deviceCodeInfo && (
                <p className="text-sm text-muted-foreground">
                    {isDeviceFlow
                        ? 'Click "Connect Trakt" to start the device authorization flow.'
                        : 'Enter your Trakt API credentials and save to use Authorization Code Flow.'}
                </p>
            )}
        </div>
    )
}
