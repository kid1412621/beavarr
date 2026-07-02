import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const bubbleVariants = cva(
    'rounded-2xl px-4 py-2.5 text-sm transition-colors relative break-words max-w-full',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
                muted: 'bg-muted text-muted-foreground',
                tinted: 'bg-primary/10 text-primary',
                outline: 'border border-border bg-background text-foreground',
                ghost: 'bg-transparent text-foreground',
                destructive: 'bg-destructive/10 text-destructive',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

interface BubbleProps
    extends React.ComponentProps<'div'>, VariantProps<typeof bubbleVariants> {
    align?: 'start' | 'end';
}

export function Bubble({
    variant,
    align = 'start',
    className,
    ...props
}: BubbleProps) {
    return (
        <div
            data-slot="bubble"
            data-align={align}
            className={cn(
                bubbleVariants({ variant }),
                align === 'end' ? 'rounded-tr-sm' : 'rounded-tl-sm',
                className,
            )}
            {...props}
        />
    );
}

export function BubbleContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="bubble-content"
            className={cn('leading-relaxed whitespace-pre-wrap', className)}
            {...props}
        />
    );
}

export function BubbleReactions({
    side = 'bottom',
    align = 'end',
    className,
    ...props
}: React.ComponentProps<'div'> & {
    side?: 'top' | 'bottom';
    align?: 'start' | 'end';
}) {
    return (
        <div
            data-slot="bubble-reactions"
            className={cn(
                'absolute flex items-center gap-1 z-10',
                side === 'bottom'
                    ? 'bottom-0 translate-y-1/2'
                    : 'top-0 -translate-y-1/2',
                align === 'end' ? 'right-4' : 'left-4',
                className,
            )}
            {...props}
        />
    );
}
