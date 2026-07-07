import { CheckCircle2, XCircle, Clipboard, ExternalLink } from 'lucide-react';

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
                        <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 select-none hover:bg-emerald-500/10">
                            <CheckCircle2 className="size-3.5" /> Connected
                        </Badge>
                    )}
                    {status === 'success' && version && (
                        <Badge variant="secondary">v{version}</Badge>
                    )}
                    {status === 'failed' && (
                        <Badge
                            variant="destructive"
                            className="gap-1 select-none"
                        >
                            <XCircle className="size-3.5" /> Connection Failed
                        </Badge>
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
                                <Spinner data-icon="inline-start" />
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
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField
                name={urlName}
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                {serviceName} URL
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value || ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        onResetStatus?.();
                                    }}
                                    placeholder={urlPlaceholder}
                                    aria-invalid={hasError}
                                />
                                {field.state.value && apiKeyHelperUrl && (
                                    <InputGroupAddon>
                                        <a
                                            href={apiKeyHelperUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-foreground flex items-center justify-center p-1"
                                            title="Get API key"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                    </InputGroupAddon>
                                )}
                            </InputGroup>
                            {hasError && (
                                <FieldError>
                                    {field.state.meta.errors?.join(', ')}
                                </FieldError>
                            )}
                        </Field>
                    );
                }}
            />
            <form.AppField
                name={apiKeyName}
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                {serviceName} API Key
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={field.name}
                                    name={field.name}
                                    type="password"
                                    value={field.state.value || ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        onResetStatus?.();
                                    }}
                                    aria-invalid={hasError}
                                />
                                <InputGroupAddon>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            pasteFromClipboard(field)
                                        }
                                        title="Paste from clipboard"
                                    >
                                        <Clipboard data-icon="inline-start" />
                                    </Button>
                                </InputGroupAddon>
                            </InputGroup>
                            {hasError && (
                                <FieldError>
                                    {field.state.meta.errors?.join(', ')}
                                </FieldError>
                            )}
                        </Field>
                    );
                }}
            />
        </FieldGroup>
    );
}
