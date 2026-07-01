import {
    CheckCircle2,
    XCircle,
    Loader2,
    Clipboard,
    ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

export const pasteFromClipboard = async (field: {
    handleChange: (value: string) => void;
}) => {
    try {
        const text = await navigator.clipboard.readText();
        field.handleChange(text);
    } catch (err) {
        console.error('Failed to read clipboard', err);
    }
};

interface ConnectableHeaderProps {
    title: string;
    status: 'idle' | 'testing' | 'success' | 'failed';
    onConnect?: () => void;
    disabled?: boolean;
    serviceName?: string;
    version?: string;
    action?: React.ReactNode;
    children?: React.ReactNode;
}

export function ConnectableHeader({
    title,
    status,
    onConnect,
    disabled,
    serviceName,
    version,
    action,
    children,
}: ConnectableHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-medium">{title}</h3>
                    {status === 'success' && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                            {version && (
                                <span className="text-muted-foreground ml-1">
                                    v{version}
                                </span>
                            )}
                        </span>
                    )}
                    {status === 'failed' && (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="h-3 w-3" /> Connection Failed
                        </span>
                    )}
                </div>
                {children}
            </div>
            <div className="flex w-full justify-start sm:w-auto sm:justify-end">
                {action || (
                    <Button
                        type="button"
                        variant={status === 'success' ? 'outline' : 'default'}
                        size="sm"
                        onClick={onConnect}
                        disabled={status === 'testing' || disabled}
                        className="w-full sm:w-auto"
                    >
                        {status === 'testing' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting...
                            </>
                        ) : status === 'success' ? (
                            'Test Connection'
                        ) : (
                            `Connect ${serviceName || title}`
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

interface ConnectableFieldsProps {
    urlName: keyof SettingsForm;
    apiKeyName: keyof SettingsForm;
    serviceName: string;
    urlPlaceholder?: string;
    apiKeyHelperUrl?: string; // Optional URL to help find the API key
    onResetStatus?: () => void;
}

export function ConnectableFields({
    urlName,
    apiKeyName,
    serviceName,
    urlPlaceholder,
    apiKeyHelperUrl,
    onResetStatus,
}: ConnectableFieldsProps) {
    const form = useAppFormContext<SettingsForm>();

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField
                name={urlName}
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>{serviceName} URL</Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value || ''}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    onResetStatus?.();
                                }}
                                placeholder={urlPlaceholder}
                                className="pr-10"
                            />
                            {field.state.value && apiKeyHelperUrl && (
                                <a
                                    href={apiKeyHelperUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                    title="Get API key"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                        {field.state.meta.errors &&
                            field.state.meta.errors.length > 0 && (
                                <em className="text-xs text-red-500">
                                    {field.state.meta.errors.join(', ')}
                                </em>
                            )}
                    </div>
                )}
            />
            <form.AppField
                name={apiKeyName}
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>
                            {serviceName} API Key
                        </Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value || ''}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    onResetStatus?.();
                                }}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => pasteFromClipboard(field)}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                title="Paste from clipboard"
                            >
                                <Clipboard className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
