import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { client } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, User, Bot, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Add missing types/declarations
interface MediaItem {
    title: string
    year?: number
    overview?: string
    remotePoster?: string
    tvdbId?: number
    tmdbId?: number
    titleSlug?: string
    images?: any[]
    seasons?: any[]
}



export const Route = createFileRoute('/chat')({
    component: ChatPage,
})

interface Message {
    role: 'user' | 'assistant'
    content: string
    steps?: any[]
}

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm Beavarr. I can help you manage your media library. Try asking me to search for a movie or TV show." }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text || isLoading) return
        setMessages(prev => [...prev, { role: 'user', content: text }])
        setIsLoading(true)

        try {
            const res = await client.api.chat.$post({
                json: { message: text }
            })

            if (!res.ok) {
                const errorData = await res.json() as any;
                throw new Error(errorData.error || 'Failed to send message');
            }

            // ChatResponse inferred from server
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                steps: data.messages
            }])
        } catch (error: any) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || "Something went wrong."}` }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        sendMessage(input.trim())
        setInput('')
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] max-w-4xl mx-auto p-4">
            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div
                                className={cn(
                                    "flex gap-3",
                                    m.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {m.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot size={16} />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "p-3 rounded-lg max-w-[80%]",
                                        m.role === 'user'
                                            ? "bg-primary text-primary-foreground ml-12"
                                            : "bg-muted mr-12"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                                </div>

                                {m.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                                        <User size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Render Rich Cards from Steps */}
                            {m.steps && m.steps.map((step: any, stepIndex: number) => {
                                // Check if tool is search related
                                if (!step.action || !step.observation) return null;
                                const tool = step.action.tool;
                                const output = step.observation;

                                if (['sonarr_search', 'radarr_search', 'tmdb_search', 'trakt_trending'].includes(tool)) {
                                    try {
                                        const items = JSON.parse(output);
                                        if (!Array.isArray(items) || items.length === 0) return null;

                                        return (
                                            <div key={`step-${stepIndex}`} className="pl-12 pr-4 overflow-x-auto">
                                                <div className="flex gap-4 pb-2">
                                                    {items.map((item: any, itemIndex: number) => (
                                                        <MediaCard
                                                            key={itemIndex}
                                                            item={item}
                                                            onAdd={(title) => sendMessage(`Add ${title} to my library`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    } catch (e) {
                                        return null;
                                    }
                                }
                                return null;
                            })}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot size={16} />
                            </div>
                            <div className="bg-muted p-3 rounded-lg flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>
                <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>
                            <Send size={16} />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}

function MediaCard({ item, onAdd }: { item: MediaItem, onAdd: (title: string) => void }) {
    const poster = item.remotePoster || (item.images && item.images.find((img: any) => img.coverType === 'poster')?.url);
    const title = item.title;

    return (
        <Card className="w-[150px] shrink-0 overflow-hidden flex flex-col group relative">
            <div className="aspect-[2/3] bg-muted relative">
                {poster ? (
                    <img src={poster} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-2 text-center">{title}</div>
                )}
                {/* Overlay Button */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" onClick={() => onAdd(title)}>
                        <Plus size={16} className="mr-1" /> Add
                    </Button>
                </div>
            </div>
            <div className="p-2 space-y-1">
                <h4 className="font-semibold text-xs truncate" title={title}>{title}</h4>
                <p className="text-[10px] text-muted-foreground">{item.year}</p>
            </div>
        </Card>
    )
}
