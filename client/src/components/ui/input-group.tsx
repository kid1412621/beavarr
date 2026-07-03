import * as React from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="input-group"
            className={cn(
                'relative flex items-stretch w-full rounded-md shadow-xs border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3 transition-[color,box-shadow]',
                className,
            )}
            {...props}
        />
    );
}

function InputGroupInput({
    className,
    ...props
}: React.ComponentProps<typeof Input>) {
    return (
        <Input
            data-slot="input-group-input"
            className={cn(
                'border-none shadow-none focus-visible:ring-0 focus-visible:border-none focus-within:ring-0 px-2.5 py-1',
                className,
            )}
            {...props}
        />
    );
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="input-group-addon"
            className={cn(
                'flex items-center justify-center px-1 shrink-0',
                className,
            )}
            {...props}
        />
    );
}

export { InputGroup, InputGroupInput, InputGroupAddon };
