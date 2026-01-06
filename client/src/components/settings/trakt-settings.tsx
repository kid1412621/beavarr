
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Clipboard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery } from '@tanstack/react-query'
import { hcWithType } from 'server/dist/client'
import { useState } from 'react'

const SERVER_URL = import.meta.env.DEV ? "http://localhost:4242" : "/";
const client = hcWithType(SERVER_URL);

export function TraktSettings({ form }: { form: any }) {
    const [isConnecting, setIsConnecting] = useState(false);

    // Query connection status
    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ['trakt-status'],
        queryFn: async () => {
            const res = await (client.api as any).trakt.status.$get();
            if (!res.ok) throw new Error('Failed to fetch status');
            return await res.json();
        },
    });

    // Get auth URL mutation
    const getAuthUrl = useMutation({
        mutationFn: async () => {
            const res = await (client.api as any).trakt['auth-url'].$get();
            if (!res.ok) throw new Error('Failed to get auth URL');
            return await res.json();
        },
        onSuccess: (data) => {
            // Redirect to Trakt authorization
            window.location.href = data.authUrl;
        },
        onError: () => {
            setIsConnecting(false);
        },
    });

    const handleConnect = async () => {
        setIsConnecting(true);
        getAuthUrl.mutate();
    };

    const handleDisconnect = useMutation({
        mutationFn: async () => {
            const res = await (client.api as any).trakt.disconnect.$delete();
            if (!res.ok) throw new Error('Failed to disconnect');
            return await res.json();
        },
        onSuccess: () => {
            refetchStatus();
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Trakt</h3>
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">Connected</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect.mutate()}
                            disabled={handleDisconnect.isPending}
                        >
                            {handleDisconnect.isPending ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnect}
                        disabled={isConnecting || getAuthUrl.isPending}
                    >
                        {isConnecting || getAuthUrl.isPending ? 'Connecting...' : 'Connect Trakt'}
                    </Button>
                )}
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
                                    disabled={isConnected}
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
                                    disabled={isConnected}
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

            {!isConnected && (
                <p className="text-sm text-muted-foreground">
                    Enter your Trakt API credentials and click "Connect Trakt" to authorize.
                </p>
            )}
        </div>
    )
}
