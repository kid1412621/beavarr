import { Clipboard as ClipboardIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from '@/components/ui/input-group';
import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import { pasteFromClipboard } from './connectable-settings';

export function AiSettings() {
    const form = useAppFormContext<SettingsForm>();
    return (
        <div className="flex flex-col gap-4">
            <form.AppField
                name="openaiApiKey"
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                OpenAI API Key
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
                name="openaiBaseUrl"
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                OpenAI Base URL
                            </FieldLabel>
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value || ''}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                aria-invalid={hasError}
                            />
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
                name="openaiModel"
                children={(field) => {
                    const hasError = !!(
                        field.state.meta.errors &&
                        field.state.meta.errors.length > 0
                    );
                    return (
                        <Field data-invalid={hasError}>
                            <FieldLabel htmlFor={field.name}>
                                OpenAI Model Name
                            </FieldLabel>
                            <Input
                                id={field.name}
                                name={field.name}
                                placeholder="gpt-5-nano"
                                value={field.state.value || ''}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                aria-invalid={hasError}
                            />
                            {hasError && (
                                <FieldError>
                                    {field.state.meta.errors?.join(', ')}
                                </FieldError>
                            )}
                        </Field>
                    );
                }}
            />
        </div>
    );
}
