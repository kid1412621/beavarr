import { ArrowDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

interface ScrollerContextValue {
    autoScroll: boolean;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    scrollToBottom: () => void;
    showScrollButton: boolean;
}

const ScrollerContext = React.createContext<ScrollerContextValue | null>(null);

export function useMessageScroller() {
    const context = React.useContext(ScrollerContext);
    if (!context)
        throw new Error(
            'useMessageScroller must be used inside MessageScrollerProvider',
        );
    return context;
}

export function MessageScrollerProvider({
    autoScroll = true,
    children,
}: {
    autoScroll?: boolean;
    children: React.ReactNode;
}) {
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    const handleScroll = React.useCallback(() => {
        if (!viewportRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        // Show button if user scrolled up significantly (e.g. >100px from bottom)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
    }, []);

    const scrollToBottom = React.useCallback(() => {
        if (!viewportRef.current) return;
        viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, []);

    React.useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Whenever children change, auto scroll if enabled and not currently scrolled up
    React.useEffect(() => {
        if (autoScroll && !showScrollButton) {
            scrollToBottom();
        }
    }, [children, autoScroll, showScrollButton, scrollToBottom]);

    return (
        <ScrollerContext.Provider
            value={{
                autoScroll,
                viewportRef,
                scrollToBottom,
                showScrollButton,
            }}
        >
            {children}
        </ScrollerContext.Provider>
    );
}

export function MessageScroller({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-scroller"
            className={cn(
                'relative flex flex-col flex-1 overflow-hidden min-h-0',
                className,
            )}
            {...props}
        />
    );
}

export function MessageScrollerViewport({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { viewportRef } = useMessageScroller();
    return (
        <div
            ref={viewportRef}
            data-slot="message-scroller-viewport"
            className={cn(
                'flex-1 overflow-y-auto w-full scroll-smooth',
                className,
            )}
            {...props}
        />
    );
}

export function MessageScrollerContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="message-scroller-content"
            className={cn('flex flex-col gap-6 p-4', className)}
            {...props}
        />
    );
}

export function MessageScrollerItem({
    messageId,
    scrollAnchor,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    messageId: string;
    scrollAnchor?: boolean;
}) {
    return (
        <div
            data-slot="message-scroller-item"
            data-message-id={messageId}
            data-scroll-anchor={scrollAnchor}
            className={cn('w-full', className)}
            {...props}
        />
    );
}

export function MessageScrollerButton({
    className,
    ...props
}: React.ComponentProps<typeof Button>) {
    const { showScrollButton, scrollToBottom } = useMessageScroller();
    if (!showScrollButton) return null;

    return (
        <Button
            data-slot="message-scroller-button"
            variant="secondary"
            size="icon"
            onClick={scrollToBottom}
            className={cn(
                'absolute bottom-4 right-4 rounded-full shadow-md z-10 size-9',
                className,
            )}
            {...props}
        >
            <ArrowDown data-icon="inline-start" />
        </Button>
    );
}
