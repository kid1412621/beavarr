import * as React from 'react';

import { cn } from '@/lib/utils';

interface MessageContextValue {
    align: 'start' | 'end';
}

const MessageContext = React.createContext<MessageContextValue>({
    align: 'start',
});

export function Message({
    align = 'start',
    className,
    ...props
}: React.ComponentProps<'div'> & { align?: 'start' | 'end' }) {
    return (
        <MessageContext.Provider value={{ align }}>
            <div
                data-slot="message"
                data-align={align}
                className={cn(
                    'flex gap-3 w-full max-w-full',
                    align === 'end'
                        ? 'flex-row-reverse justify-start'
                        : 'flex-row justify-start',
                    className,
                )}
                {...props}
            />
        </MessageContext.Provider>
    );
}

export function MessageAvatar({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-avatar"
            className={cn(
                'flex items-center justify-center shrink-0 size-8 rounded-full overflow-hidden',
                className,
            )}
            {...props}
        />
    );
}

export function MessageContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { align } = React.useContext(MessageContext);
    return (
        <div
            data-slot="message-content"
            className={cn(
                'flex flex-col gap-1 max-w-[80%]',
                align === 'end' ? 'items-end ml-12' : 'items-start mr-12',
                className,
            )}
            {...props}
        />
    );
}

export function MessageHeader({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-header"
            className={cn(
                'text-xs text-muted-foreground font-medium',
                className,
            )}
            {...props}
        />
    );
}

export function MessageFooter({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-footer"
            className={cn('text-[10px] text-muted-foreground mt-1', className)}
            {...props}
        />
    );
}

export function MessageGroup({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-group"
            className={cn('flex flex-col gap-2 w-full', className)}
            {...props}
        />
    );
}
