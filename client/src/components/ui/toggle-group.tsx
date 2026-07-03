import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import * as React from 'react';

import { cn } from '@/lib/utils';

function ToggleGroup({
    className,
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive>) {
    return (
        <ToggleGroupPrimitive
            data-slot="toggle-group"
            className={cn(
                'inline-flex items-center gap-1 bg-muted p-1 rounded-md',
                className,
            )}
            {...props}
        />
    );
}

function ToggleGroupItem({
    className,
    ...props
}: React.ComponentProps<typeof TogglePrimitive>) {
    return (
        <TogglePrimitive
            data-slot="toggle-group-item"
            className={cn(
                'inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md transition-all select-none cursor-pointer',
                'text-muted-foreground hover:text-foreground hover:bg-background/50',
                'data-[pressed]:bg-background data-[pressed]:text-foreground data-[pressed]:shadow-xs',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { ToggleGroup, ToggleGroupItem };
