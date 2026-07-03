import { Field as FieldPrimitive } from '@base-ui/react/field';
import * as React from 'react';

import { cn } from '@/lib/utils';

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="field-group"
            className={cn('flex flex-col gap-4', className)}
            {...props}
        />
    );
}

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
    return (
        <FieldPrimitive.Root
            data-slot="field"
            className={cn('flex flex-col gap-2 group/field w-full', className)}
            {...props}
        />
    );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
    return (
        <FieldPrimitive.Label
            data-slot="field-label"
            className={cn(
                'text-sm leading-none font-medium group-data-[disabled]:opacity-50 select-none cursor-pointer',
                className,
            )}
            {...props}
        />
    );
}

function FieldDescription({
    className,
    ...props
}: FieldPrimitive.Description.Props) {
    return (
        <FieldPrimitive.Description
            data-slot="field-description"
            className={cn('text-xs text-muted-foreground', className)}
            {...props}
        />
    );
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
    return (
        <FieldPrimitive.Error
            data-slot="field-error"
            className={cn('text-xs text-destructive font-medium', className)}
            {...props}
        />
    );
}

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldError };
