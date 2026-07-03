import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const attachmentVariants = cva(
    'relative border border-border bg-background rounded-lg flex items-center gap-3 p-3 overflow-hidden max-w-sm transition-all',
    {
        variants: {
            state: {
                idle: '',
                uploading: 'opacity-70 border-dashed animate-pulse',
                processing: 'opacity-80',
                error: 'border-destructive/50 bg-destructive/5',
                done: '',
            },
            size: {
                default: 'min-w-[200px]',
                sm: 'min-w-[150px] p-2 text-xs gap-2',
                xs: 'min-w-[100px] p-1 text-[10px] gap-1.5',
            },
        },
        defaultVariants: {
            state: 'idle',
            size: 'default',
        },
    },
);

interface AttachmentProps
    extends
        React.ComponentProps<'div'>,
        VariantProps<typeof attachmentVariants> {}

export function Attachment({
    state = 'idle',
    size = 'default',
    className,
    children,
    ...props
}: AttachmentProps) {
    return (
        <div
            data-slot="attachment"
            data-state={state}
            className={cn(attachmentVariants({ state, size }), className)}
            {...props}
        >
            {children}
            {(state === 'uploading' || state === 'processing') && (
                <div className="bg-muted/20 absolute inset-0 flex items-center justify-center backdrop-blur-[0.5px]">
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
            )}
        </div>
    );
}

export function AttachmentMedia({
    variant = 'icon',
    className,
    ...props
}: React.ComponentProps<'div'> & { variant?: 'icon' | 'image' }) {
    return (
        <div
            data-slot="attachment-media"
            className={cn(
                'flex items-center justify-center shrink-0 rounded overflow-hidden bg-muted',
                variant === 'image'
                    ? 'size-12'
                    : 'size-8 text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}

export function AttachmentContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="attachment-content"
            className={cn('flex flex-col gap-0.5 flex-1 min-w-0', className)}
            {...props}
        />
    );
}

export function AttachmentTitle({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="attachment-title"
            className={cn(
                'text-sm font-medium truncate text-foreground',
                className,
            )}
            {...props}
        />
    );
}

export function AttachmentDescription({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="attachment-description"
            className={cn('text-xs text-muted-foreground truncate', className)}
            {...props}
        />
    );
}

export function AttachmentActions({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="attachment-actions"
            className={cn(
                'flex items-center gap-1 shrink-0 ml-auto',
                className,
            )}
            {...props}
        />
    );
}

export function AttachmentGroup({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="attachment-group"
            className={cn(
                'flex gap-2 overflow-x-auto py-1 scroll-fade-x',
                className,
            )}
            {...props}
        />
    );
}
