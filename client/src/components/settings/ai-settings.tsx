import { Clipboard as ClipboardIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { pasteFromClipboard } from './connectable-settings';

export function AiSettings() {
    const form = useAppFormContext<SettingsForm>();
    return (
        <div className="space-y-4">
            <form.AppField
                name="openaiApiKey"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI API Key</Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value || ''}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => pasteFromClipboard(field)}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                title="Paste from clipboard"
                            >
                                <ClipboardIcon className="h-4 w-4" />
                            </button>
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
                name="openaiBaseUrl"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI Base URL</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
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
                name="openaiModel"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI Model Name</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            placeholder="gpt-4.1-nano"
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors &&
                            field.state.meta.errors.length > 0 && (
                                <em className="text-xs text-red-500">
                                    {field.state.meta.errors.join(', ')}
                                </em>
                            )}
                    </div>
                )}
            />
        </div>
    );
}
