import { Clipboard as ClipboardIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from '@/components/ui/input-group';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { pasteFromClipboard } from './connectable-settings';

export function MediaSettings() {
    const form = useAppFormContext<SettingsForm>();

    return (
        <div className="flex flex-col gap-4">
            <form.AppField
                name="tmdbApiKey"
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                TMDB API Key
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={field.name}
                                    name={field.name}
                                    type="password"
                                    value={field.state.value || ''}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
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
                                        <ClipboardIcon data-icon="inline-start" />
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

            <form.AppField
                name="tvdbApiKey"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>TVDB API Key</Label>
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
                    </div>
                )}
            />

            <form.AppField
                name="imdbApiKey"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>IMDB API Key</Label>
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
                    </div>
                )}
            />
        </div>
    );
}
