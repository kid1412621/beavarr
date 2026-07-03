import { createFileRoute } from '@tanstack/react-router';
import { Send, User, Bot, Plus } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Message,
    MessageAvatar,
    MessageContent,
    MessageGroup,
} from '@/components/ui/message';
import {
    MessageScrollerProvider,
    MessageScroller,
    MessageScrollerViewport,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerButton,
} from '@/components/ui/message-scroller';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { client } from '@/lib/api';

// Add missing types/declarations
interface MediaItem {
    title: string;
    year?: number;
    overview?: string;
    remotePoster?: string;
    tvdbId?: number;
    tmdbId?: number;
    titleSlug?: string;
    images?: any[];
    seasons?: any[];
}

export const Route = createFileRoute('/chat')({
    component: ChatPage,
});

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    steps?: any[];
}

function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content:
                "Hello! I'm Beavarr. I can help you manage your media library. Try asking me to search for a movie or TV show.",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (text: string) => {
        if (!text || isLoading) return;
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setIsLoading(true);

        try {
            const res = await client.api.chat.$post({
                json: { message: text },
            });

            if (!res.ok) {
                const errorData = (await res.json()) as any;
                throw new Error(errorData.error || 'Failed to send message');
            }

            // ChatResponse inferred from server
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.response,
                    steps: data.messages,
                },
            ]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Error: ${error.message || 'Something went wrong.'}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput('');
    };

    return (
        <div className="mx-auto flex h-[calc(100vh-theme(spacing.16))] max-w-4xl flex-col p-4">
            <Card className="flex flex-1 flex-col overflow-hidden">
                <MessageScrollerProvider autoScroll>
                    <MessageScroller>
                        <MessageScrollerViewport>
                            <MessageScrollerContent className="flex flex-col gap-6 p-4">
                                {messages.map((m, i) => (
                                    <MessageScrollerItem
                                        key={i}
                                        messageId={`msg-${i}`}
                                        scrollAnchor={m.role === 'user'}
                                    >
                                        <MessageGroup className="flex flex-col gap-2">
                                            <Message
                                                align={
                                                    m.role === 'user'
                                                        ? 'end'
                                                        : 'start'
                                                }
                                            >
                                                <MessageAvatar>
                                                    <Avatar
                                                        className={
                                                            m.role ===
                                                            'assistant'
                                                                ? 'bg-primary/10'
                                                                : 'bg-primary text-primary-foreground'
                                                        }
                                                    >
                                                        <AvatarFallback>
                                                            {m.role ===
                                                            'assistant' ? (
                                                                <Bot />
                                                            ) : (
                                                                <User />
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </MessageAvatar>

                                                <MessageContent>
                                                    <Bubble
                                                        variant={
                                                            m.role === 'user'
                                                                ? 'default'
                                                                : 'muted'
                                                        }
                                                        align={
                                                            m.role === 'user'
                                                                ? 'end'
                                                                : 'start'
                                                        }
                                                    >
                                                        <BubbleContent>
                                                            {m.content}
                                                        </BubbleContent>
                                                    </Bubble>
                                                </MessageContent>
                                            </Message>

                                            {/* Render Rich Cards from Steps */}
                                            {m.steps?.map(
                                                (
                                                    step: any,
                                                    stepIndex: number,
                                                ) => {
                                                    if (
                                                        !step.action ||
                                                        !step.observation
                                                    )
                                                        return null;
                                                    const tool =
                                                        step.action.tool;
                                                    const output =
                                                        step.observation;

                                                    if (
                                                        [
                                                            'sonarr_search',
                                                            'radarr_search',
                                                            'tmdb_search',
                                                            'trakt_trending',
                                                        ].includes(tool)
                                                    ) {
                                                        let items: any[] = [];
                                                        try {
                                                            const parsed =
                                                                JSON.parse(
                                                                    output,
                                                                );
                                                            items =
                                                                Array.isArray(
                                                                    parsed,
                                                                )
                                                                    ? parsed
                                                                    : [];
                                                        } catch (e) {
                                                            console.error(
                                                                `Failed to parse ${tool} output:`,
                                                                e,
                                                            );
                                                            return null;
                                                        }

                                                        if (items.length === 0)
                                                            return null;

                                                        return (
                                                            <div
                                                                key={`step-${stepIndex}`}
                                                                className="overflow-x-auto pr-4 pl-12"
                                                            >
                                                                <div className="flex gap-4 pb-2">
                                                                    {items.map(
                                                                        (
                                                                            item: any,
                                                                            itemIndex: number,
                                                                        ) => (
                                                                            <MediaCard
                                                                                key={
                                                                                    itemIndex
                                                                                }
                                                                                item={
                                                                                    item
                                                                                }
                                                                                onAdd={(
                                                                                    title,
                                                                                ) =>
                                                                                    sendMessage(
                                                                                        `Add ${title} to my library`,
                                                                                    )
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                },
                                            )}
                                        </MessageGroup>
                                    </MessageScrollerItem>
                                ))}
                                {isLoading && (
                                    <MessageScrollerItem
                                        messageId="loading"
                                        scrollAnchor
                                    >
                                        <Message align="start">
                                            <MessageAvatar>
                                                <Avatar className="bg-primary/10">
                                                    <AvatarFallback>
                                                        <Bot />
                                                    </AvatarFallback>
                                                </Avatar>
                                            </MessageAvatar>
                                            <MessageContent>
                                                <Bubble variant="muted">
                                                    <BubbleContent className="flex min-w-8 items-center justify-center">
                                                        <Spinner />
                                                    </BubbleContent>
                                                </Bubble>
                                            </MessageContent>
                                        </Message>
                                    </MessageScrollerItem>
                                )}
                            </MessageScrollerContent>
                        </MessageScrollerViewport>
                        <MessageScrollerButton />
                    </MessageScroller>
                </MessageScrollerProvider>
                <Separator />
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                        >
                            <Send data-icon="inline-start" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}

function MediaCard({
    item,
    onAdd,
}: {
    item: MediaItem;
    onAdd: (title: string) => void;
}) {
    const poster =
        item.remotePoster ||
        item.images?.find((img: any) => img.coverType === 'poster')?.url;
    const title = item.title;

    return (
        <Card className="group relative flex w-[150px] shrink-0 flex-col overflow-hidden">
            <div className="bg-muted relative aspect-[2/3]">
                {poster ? (
                    <img
                        src={poster}
                        alt={title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center p-2 text-center text-xs">
                        {title}
                    </div>
                )}
                {/* Overlay Button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAdd(title)}
                    >
                        <Plus data-icon="inline-start" /> Add
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-1 p-2">
                <h4 className="truncate text-xs font-semibold" title={title}>
                    {title}
                </h4>
                <p className="text-muted-foreground text-[10px]">{item.year}</p>
            </div>
        </Card>
    );
}
