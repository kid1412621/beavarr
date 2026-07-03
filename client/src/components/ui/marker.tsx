import * as React from 'react';

import { cn } from '@/lib/utils';

import { Separator } from './separator';

interface MarkerProps extends React.ComponentProps<'div'> {
    variant?: 'default' | 'separator' | 'border';
}

export function Marker({
    variant = 'default',
    className,
    children,
    ...props
}: MarkerProps) {
    if (variant === 'separator') {
        return (
            <div
                data-slot="marker"
                data-variant={variant}
                className={cn('flex items-center gap-3 py-2 w-full', className)}
                {...props}
            >
                <Separator className="flex-1" />
                <div className="text-muted-foreground text-xs font-medium whitespace-nowrap select-none">
                    {children}
                </div>
                <Separator className="flex-1" />
            </div>
        );
    }

    return (
        <div
            data-slot="marker"
            data-variant={variant}
            className={cn(
                'flex items-center justify-center py-2 text-xs text-muted-foreground font-medium select-none text-center w-full',
                variant === 'border' && 'border-b border-border pb-3 mb-2',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function MarkerIcon({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="marker-icon"
            className={cn(
                'size-3.5 text-muted-foreground shrink-0 [&_svg]:size-full mr-1.5',
                className,
            )}
            {...props}
        />
    );
}

export function MarkerContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="marker-content"
            className={cn('leading-none', className)}
            {...props}
        />
    );
}
