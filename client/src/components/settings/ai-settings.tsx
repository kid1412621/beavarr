import { Clipboard } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AiSettings({ form }: { form: any }) {
    const pasteFromClipboard = async (field: any) => {
        try {
            const text = await navigator.clipboard.readText();
            field.handleChange(text);
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    return (
        <div className="space-y-4">
            <form.Field
                name="openaiApiKey"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI API Key</Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
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
                        {field.state.meta.touchedErrors?.length > 0 && (
                            <em className="text-xs text-red-500">
                                {field.state.meta.touchedErrors.join(', ')}
                            </em>
                        )}
                    </div>
                )}
            />
            <form.Field
                name="openaiBaseUrl"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI Base URL</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.touchedErrors?.length > 0 && (
                            <em className="text-xs text-red-500">
                                {field.state.meta.touchedErrors.join(', ')}
                            </em>
                        )}
                    </div>
                )}
            />
            <form.Field
                name="openaiModel"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>OpenAI Model Name</Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            placeholder="gpt-4.1-nano"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.touchedErrors?.length > 0 && (
                            <em className="text-xs text-red-500">
                                {field.state.meta.touchedErrors.join(', ')}
                            </em>
                        )}
                    </div>
                )}
            />
        </div>
    );
}
