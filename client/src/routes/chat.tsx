import { createFileRoute } from '@tanstack/react-router';
import { Send, User, Bot, Loader2, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { client } from '@/lib/api';
import { cn } from '@/lib/utils';

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

interface Message {
    role: 'user' | 'assistant';
    content: string;
    steps?: any[];
}

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content:
                "Hello! I'm Beavarr. I can help you manage your media library. Try asking me to search for a movie or TV show.",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
                <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                    {messages.map((m, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div
                                className={cn(
                                    'flex gap-3',
                                    m.role === 'user'
                                        ? 'justify-end'
                                        : 'justify-start',
                                )}
                            >
                                {m.role === 'assistant' && (
                                    <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                        <Bot size={16} />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        'p-3 rounded-lg max-w-[80%]',
                                        m.role === 'user'
                                            ? 'bg-primary text-primary-foreground ml-12'
                                            : 'bg-muted mr-12',
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">
                                        {m.content}
                                    </p>
                                </div>

                                {m.role === 'user' && (
                                    <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                                        <User size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Render Rich Cards from Steps */}
                            {m.steps?.map((step: any, stepIndex: number) => {
                                // Check if tool is search related
                                if (!step.action || !step.observation)
                                    return null;
                                const tool = step.action.tool;
                                const output = step.observation;

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
                                        const parsed = JSON.parse(output);
                                        items = Array.isArray(parsed)
                                            ? parsed
                                            : [];
                                    } catch (e) {
                                        console.error(
                                            `Failed to parse ${tool} output:`,
                                            e,
                                        );
                                        return null;
                                    }

                                    if (items.length === 0) return null;

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
                                                            key={itemIndex}
                                                            item={item}
                                                            onAdd={(title) =>
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
                            })}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start gap-3">
                            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                <Bot size={16} />
                            </div>
                            <div className="bg-muted flex items-center rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>
                <div className="border-t p-4">
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
                        >
                            <Send size={16} />
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
                        <Plus size={16} className="mr-1" /> Add
                    </Button>
                </div>
            </div>
            <div className="space-y-1 p-2">
                <h4 className="truncate text-xs font-semibold" title={title}>
                    {title}
                </h4>
                <p className="text-muted-foreground text-[10px]">{item.year}</p>
            </div>
        </Card>
    );
}
