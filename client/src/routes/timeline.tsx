import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
    Search,
    RefreshCw,
    Sparkles,
    Check,
    Plus,
    Loader2,
    Calendar,
    ArrowRight,
    ArrowLeft,
    Film,
    Tv,
    ChevronDown,
    ChevronUp,
    LayoutList,
    Columns,
} from 'lucide-react';
import { useState } from 'react';
import type { TimelineItem, FranchiseTimeline } from 'shared';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { client, settingsQueryOptions } from '@/lib/api';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/timeline')({
    component: TimelineExplorer,
});

function TimelineExplorer() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSlug, setActiveSlug] = useState<string | null>(null);

    // Query settings to check service connections
    const { data: settings } = useQuery(settingsQueryOptions);
    const isSonarrConfigured =
        !!settings?.sonarrUrl && !!settings?.sonarrApiKey;
    const isRadarrConfigured =
        !!settings?.radarrUrl && !!settings?.radarrApiKey;

    const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>(
        'vertical',
    );
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
        {},
    );
    const [selectedDetailItem, setSelectedDetailItem] =
        useState<TimelineItem | null>(null);

    // Search query for autocomplete/results
    const {
        data: searchResults,
        isFetching: isSearching,
        refetch: triggerSearch,
    } = useQuery({
        queryKey: ['franchiseSearch', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const res = await client.api.franchise.search.$get({
                query: { query: searchQuery },
            });
            if (!res.ok) throw new Error('Search failed');
            return await res.json();
        },
        enabled: false, // only trigger on submit
        retry: false,
    });

    // Suggested franchises (present in library)
    const { data: suggestedFranchises, isPending: isLoadingSuggested } =
        useQuery({
            queryKey: ['suggestedFranchises'],
            queryFn: async () => {
                const res = await client.api.franchise.suggested.$get();
                if (!res.ok)
                    throw new Error('Failed to fetch suggested franchises');
                return await res.json();
            },
            retry: false,
        });

    // Timeline details query
    const { data: timelineData, isFetching: isLoadingTimeline } = useQuery({
        queryKey: ['franchiseTimeline', activeSlug],
        queryFn: async () => {
            if (!activeSlug) return null;
            const res = await client.api.franchise.timeline.$get({
                query: { slug: activeSlug, refresh: 'false' },
            });
            if (!res.ok) throw new Error('Failed to load timeline');
            const data = (await res.json()) as FranchiseTimeline;

            // Set initial selected item for horizontal details panel
            if (data.items.length > 0) {
                setSelectedDetailItem(data.items[0]);
            }
            return data;
        },
        enabled: !!activeSlug,
        retry: false,
    });

    // Force refresh timeline mutation
    const { mutate: refreshTimelineForce, isPending: isRefreshing } =
        useMutation({
            mutationFn: async () => {
                if (!activeSlug) return;
                const res = await client.api.franchise.timeline.$get({
                    query: { slug: activeSlug, refresh: 'true' },
                });
                if (!res.ok) throw new Error('Failed to refresh timeline');
                return (await res.json()) as FranchiseTimeline;
            },
            onSuccess: (data) => {
                if (data) {
                    queryClient.setQueryData(
                        ['franchiseTimeline', activeSlug],
                        data,
                    );
                    if (data.items.length > 0) {
                        setSelectedDetailItem(data.items[0]);
                    }
                    toast.success('Timeline refreshed successfully!');
                }
            },
            onError: (err) => {
                toast.error(`Refresh failed: ${err.message}`);
            },
        });

    // Add item to library mutation
    const { mutate: addItemToLibrary, variables } = useMutation({
        mutationFn: async (item: TimelineItem) => {
            const res = await client.api.franchise['add-item'].$post({
                json: {
                    mediaId: item.mediaId,
                    type: item.type,
                    title: item.title,
                },
            });
            if (!res.ok) {
                const errData = (await res.json()) as any;
                throw new Error(errData.error || 'Failed to add item');
            }
            return await res.json();
        },
        onSuccess: (_, item) => {
            toast.success(`Successfully added "${item.title}" to library!`);
            // Update local query state
            queryClient.setQueryData(
                ['franchiseTimeline', activeSlug],
                (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.map((i: TimelineItem) =>
                            i.mediaId === item.mediaId && i.type === item.type
                                ? {
                                      ...i,
                                      inLibrary: true,
                                      libraryStatus: 'monitored',
                                  }
                                : i,
                        ),
                    };
                },
            );
            if (
                selectedDetailItem &&
                selectedDetailItem.mediaId === item.mediaId &&
                selectedDetailItem.type === item.type
            ) {
                setSelectedDetailItem((prev) =>
                    prev
                        ? {
                              ...prev,
                              inLibrary: true,
                              libraryStatus: 'monitored',
                          }
                        : null,
                );
            }
        },
        onError: (err, item) => {
            toast.error(`Failed to add "${item.title}": ${err.message}`);
        },
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            triggerSearch();
        }
    };

    const toggleExpand = (mediaId: number) => {
        setExpandedItems((prev) => ({ ...prev, [mediaId]: !prev[mediaId] }));
    };

    const handleScrollHorizontal = (direction: 'left' | 'right') => {
        const container = document.getElementById('filmstrip-container');
        if (container) {
            const scrollAmount = 400;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const isItemAdding = (item: TimelineItem) => {
        return (
            variables?.mediaId === item.mediaId && variables?.type === item.type
        );
    };

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col p-4 md:p-6">
            {/* Top Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="from-primary to-muted-foreground flex items-center gap-2 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                        <Sparkles className="text-primary size-8 animate-pulse" />
                        Franchise Timeline Explorer
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Explore chronological storylines and easily add missing
                        titles to your library.
                    </p>
                </div>

                {/* View toggles if timeline is active */}
                {timelineData && (
                    <div className="bg-card border-border flex items-center gap-2 self-start rounded-lg border p-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'flex items-center gap-1.5 text-xs h-8 px-3 rounded-md',
                                viewMode === 'vertical'
                                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => setViewMode('vertical')}
                        >
                            <LayoutList className="size-4" />
                            Vertical Timeline
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'flex items-center gap-1.5 text-xs h-8 px-3 rounded-md',
                                viewMode === 'horizontal'
                                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => setViewMode('horizontal')}
                        >
                            <Columns className="size-4" />
                            Horizontal Track
                        </Button>
                    </div>
                )}
            </div>

            {/* Search Section */}
            <div className="mb-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
                            <Input
                                placeholder="Search for a franchise (e.g. Alien, Star Wars, Marvel, Indiana Jones)..."
                                className="bg-card border-border text-foreground placeholder-muted-foreground focus-visible:ring-ring h-12 rounded-lg pl-10 text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSearching}
                            className="bg-primary text-primary-foreground flex h-12 items-center gap-2 rounded-lg px-6 text-base font-semibold shadow"
                        >
                            {isSearching ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <Search className="size-5" />
                            )}
                            Search
                        </Button>
                    </form>

                    {/* Search Results */}
                    {searchResults && searchResults.length > 0 && (
                        <Card className="bg-card border-border overflow-hidden rounded-lg shadow-lg">
                            <CardContent className="grid gap-2 p-4">
                                <h3 className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
                                    Search Results
                                </h3>
                                {searchResults.map((result: any) => (
                                    <div
                                        key={
                                            result.id === 0
                                                ? `custom-${result.name}`
                                                : `${result.type}-${result.id}`
                                        }
                                        className={cn(
                                            'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                                            activeSlug ===
                                                (result.id === 0
                                                    ? searchQuery
                                                    : `collection-${result.id}`)
                                                ? 'bg-accent/40 border-primary/60'
                                                : 'bg-background border-border hover:bg-muted/40',
                                        )}
                                        onClick={() => {
                                            setActiveSlug(
                                                result.id === 0
                                                    ? searchQuery
                                                    : `collection-${result.id}`,
                                            );
                                            setSearchQuery('');
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.type === 'custom' ? (
                                                <div className="bg-accent border-border flex size-10 items-center justify-center rounded-md border">
                                                    <Sparkles className="text-primary size-5" />
                                                </div>
                                            ) : (
                                                <div className="bg-accent border-border flex size-10 items-center justify-center rounded-md border">
                                                    <Film className="text-primary size-5" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-foreground font-semibold">
                                                    {result.name}
                                                </div>
                                                <div className="text-muted-foreground line-clamp-1 text-xs">
                                                    {result.overview}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-muted-foreground size-4" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Suggested from Library */}
                <div className="bg-card border-border rounded-xl border p-4 shadow-sm lg:col-span-4">
                    <h3 className="text-primary mb-3 flex items-center gap-1.5 text-sm font-bold tracking-wider uppercase">
                        <Film className="size-4" />
                        Franchises in Your Library
                    </h3>

                    {isLoadingSuggested ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="text-muted-foreground size-6 animate-spin" />
                        </div>
                    ) : suggestedFranchises &&
                      suggestedFranchises.length > 0 ? (
                        <div className="grid gap-2">
                            {suggestedFranchises.map((sug: any) => (
                                <button
                                    key={sug.slug}
                                    onClick={() => setActiveSlug(sug.slug)}
                                    className={cn(
                                        'w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center',
                                        activeSlug === sug.slug
                                            ? 'bg-accent/40 border-primary/60'
                                            : 'bg-background border-border hover:bg-muted/30 hover:border-border',
                                    )}
                                >
                                    <div>
                                        <div className="text-foreground text-sm font-medium">
                                            {sug.name}
                                        </div>
                                        <div className="text-muted-foreground line-clamp-1 text-xs">
                                            {sug.overview}
                                        </div>
                                    </div>
                                    <ArrowRight className="text-muted-foreground size-3.5" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground py-6 text-center text-xs italic">
                            No franchises found in your library yet. Add some
                            movies to suggest options!
                        </p>
                    )}
                </div>
            </div>

            {/* Main Timeline View */}
            {isLoadingTimeline ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <Loader2 className="text-primary size-10 animate-spin" />
                    <p className="text-muted-foreground font-medium">
                        Assembling franchise timeline and fetching metadata...
                    </p>
                </div>
            ) : timelineData ? (
                <div className="flex flex-1 flex-col gap-6">
                    {/* Active Franchise Header */}
                    <div className="bg-card border-border flex flex-col justify-between gap-4 rounded-xl border p-6 shadow-md md:flex-row md:items-center">
                        <div>
                            <span className="text-primary text-xs font-bold tracking-widest uppercase">
                                Active Franchise
                            </span>
                            <h2 className="text-foreground mt-1 text-2xl font-black">
                                {timelineData.name}
                            </h2>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                Last synced:{' '}
                                {new Date(
                                    timelineData.updatedAt,
                                ).toLocaleString()}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isRefreshing}
                            onClick={() => refreshTimelineForce()}
                            className="bg-background border-border text-foreground hover:bg-muted flex items-center gap-1.5 self-start shadow md:self-center"
                        >
                            {isRefreshing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <RefreshCw className="size-4" />
                            )}
                            Sync & Rebuild Timeline
                        </Button>
                    </div>

                    {/* Setup Warnings if Service is Disconnected */}
                    {(!isSonarrConfigured || !isRadarrConfigured) && (
                        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 shadow-sm md:flex-row md:items-center md:justify-between dark:text-amber-400">
                            <div>
                                <span className="font-bold">
                                    Setup Required
                                </span>
                                :
                                {!isSonarrConfigured && !isRadarrConfigured
                                    ? ' Configure Radarr and Sonarr in settings to add missing titles to download.'
                                    : !isSonarrConfigured
                                      ? ' Configure Sonarr in settings to add missing TV shows to download.'
                                      : ' Configure Radarr in settings to add missing movies to download.'}
                            </div>
                            <Link
                                to="/settings"
                                className="self-start text-xs font-bold text-amber-700 underline hover:opacity-80 md:self-auto dark:text-amber-300"
                            >
                                Go to Settings
                            </Link>
                        </div>
                    )}

                    {/* VIEW MODE: VERTICAL TIMELINE */}
                    {viewMode === 'vertical' ? (
                        <div className="border-border ml-4 space-y-8 border-l py-4 pl-6 md:ml-6 md:pl-10">
                            {timelineData.items.map((item) => (
                                <div
                                    key={`${item.type}-${item.mediaId}`}
                                    className="group relative"
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={cn(
                                            'absolute -left-[31px] md:-left-[47px] top-4 size-5 rounded-full border-4 flex items-center justify-center transition-all duration-300',
                                            item.inLibrary
                                                ? 'bg-emerald-500 border-background ring-4 ring-emerald-500/20'
                                                : 'bg-muted border-background group-hover:bg-primary',
                                        )}
                                    >
                                        {item.inLibrary && (
                                            <Check className="size-2 text-white" />
                                        )}
                                    </div>

                                    {/* Timeline Card */}
                                    <Card
                                        className={cn(
                                            'bg-card border-border rounded-xl transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md border p-0',
                                        )}
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Poster */}
                                            {item.posterPath ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                                                    alt={item.title}
                                                    className="h-48 w-full rounded-t-xl object-cover md:h-auto md:w-32 md:rounded-l-xl md:rounded-tr-none"
                                                />
                                            ) : (
                                                <div className="bg-muted text-muted-foreground flex h-48 w-full flex-col items-center justify-center rounded-t-xl md:h-auto md:w-32 md:rounded-l-xl md:rounded-tr-none">
                                                    {item.type === 'movie' ? (
                                                        <Film className="size-8" />
                                                    ) : (
                                                        <Tv className="size-8" />
                                                    )}
                                                    <span className="mt-1.5 text-[10px] font-bold uppercase">
                                                        {item.type}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex flex-1 flex-col justify-between p-5">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-muted-foreground text-sm font-bold">
                                                            #{item.order}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider flex items-center gap-1 border',
                                                                item.type ===
                                                                    'movie'
                                                                    ? 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                                                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                                                            )}
                                                        >
                                                            {item.type ===
                                                            'movie' ? (
                                                                <Film className="size-2.5" />
                                                            ) : (
                                                                <Tv className="size-2.5" />
                                                            )}
                                                            {item.type}
                                                        </span>
                                                        {item.seasonNumber && (
                                                            <span className="bg-muted border-border text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-bold">
                                                                Season{' '}
                                                                {
                                                                    item.seasonNumber
                                                                }
                                                            </span>
                                                        )}
                                                        {item.releaseDate && (
                                                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                                <Calendar className="size-3" />
                                                                {new Date(
                                                                    item.releaseDate,
                                                                ).getFullYear()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-foreground mt-2 text-xl font-bold">
                                                        {item.title}
                                                    </h3>

                                                    {/* Expanded/Collapsed overview */}
                                                    {item.overview && (
                                                        <div className="mt-3">
                                                            <p
                                                                className={cn(
                                                                    'text-sm text-muted-foreground font-light leading-relaxed',
                                                                    expandedItems[
                                                                        item
                                                                            .mediaId
                                                                    ]
                                                                        ? 'block'
                                                                        : 'line-clamp-2',
                                                                )}
                                                            >
                                                                {item.overview}
                                                            </p>
                                                            <button
                                                                onClick={() =>
                                                                    toggleExpand(
                                                                        item.mediaId,
                                                                    )
                                                                }
                                                                className="text-primary hover:text-primary/80 mt-1 flex items-center gap-0.5 text-xs font-semibold"
                                                            >
                                                                {expandedItems[
                                                                    item.mediaId
                                                                ] ? (
                                                                    <>
                                                                        Show
                                                                        Less{' '}
                                                                        <ChevronUp className="size-3" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Read
                                                                        Synopsis{' '}
                                                                        <ChevronDown className="size-3" />
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Library action buttons */}
                                                <div className="border-border mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.inLibrary ? (
                                                            <>
                                                                {item.libraryStatus !==
                                                                    'jellyfin' && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                        <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                                                                        In
                                                                        Library
                                                                        (
                                                                        {
                                                                            item.libraryStatus
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                                {item.jellyfinId && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                                                                        <span className="size-2 animate-pulse rounded-full bg-purple-500" />
                                                                        Jellyfin
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="bg-muted border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                                                                Not Added
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!item.inLibrary && (
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                isItemAdding(
                                                                    item,
                                                                ) ||
                                                                (item.type ===
                                                                'movie'
                                                                    ? !isRadarrConfigured
                                                                    : !isSonarrConfigured)
                                                            }
                                                            title={
                                                                item.type ===
                                                                'movie'
                                                                    ? !isRadarrConfigured
                                                                        ? 'Radarr is not configured'
                                                                        : ''
                                                                    : !isSonarrConfigured
                                                                      ? 'Sonarr is not configured'
                                                                      : ''
                                                            }
                                                            onClick={() =>
                                                                addItemToLibrary(
                                                                    item,
                                                                )
                                                            }
                                                            className="bg-primary text-primary-foreground flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold shadow disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isItemAdding(
                                                                item,
                                                            ) ? (
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                            ) : (
                                                                <Plus className="size-3.5" />
                                                            )}
                                                            Add to{' '}
                                                            {item.type ===
                                                            'movie'
                                                                ? 'Radarr'
                                                                : 'Sonarr'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* VIEW MODE: HORIZONTAL FILMSTRIP TRACK */
                        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
                            {/* Filmstrip scrolling track */}
                            <div className="flex flex-col gap-4 lg:col-span-8">
                                <div className="bg-muted/20 border-border flex items-center justify-between rounded-lg border p-2.5 shadow-sm">
                                    <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                        Scroll through timeline
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleScrollHorizontal('left')
                                            }
                                            className="bg-card border-border text-muted-foreground hover:text-foreground h-8 w-8 rounded-full border shadow-sm"
                                        >
                                            <ArrowLeft className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleScrollHorizontal('right')
                                            }
                                            className="bg-card border-border text-muted-foreground hover:text-foreground h-8 w-8 rounded-full border shadow-sm"
                                        >
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div
                                    id="filmstrip-container"
                                    className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}
                                >
                                    {timelineData.items.map((item) => (
                                        <div
                                            key={`${item.type}-${item.mediaId}`}
                                            className={cn(
                                                'flex-shrink-0 w-44 snap-start cursor-pointer transition-all duration-200',
                                                selectedDetailItem?.mediaId ===
                                                    item.mediaId &&
                                                    selectedDetailItem?.type ===
                                                        item.type
                                                    ? 'scale-105'
                                                    : 'opacity-80 hover:opacity-100',
                                            )}
                                            onClick={() =>
                                                setSelectedDetailItem(item)
                                            }
                                        >
                                            <Card
                                                className={cn(
                                                    'bg-card border-2 rounded-xl overflow-hidden shadow h-full flex flex-col',
                                                    selectedDetailItem?.mediaId ===
                                                        item.mediaId &&
                                                        selectedDetailItem?.type ===
                                                            item.type
                                                        ? 'border-primary ring-4 ring-primary/10'
                                                        : 'border-border',
                                                )}
                                            >
                                                {/* Poster */}
                                                <div className="relative aspect-[2/3] w-full">
                                                    {item.posterPath ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                                                            alt={item.title}
                                                            className="h-full w-full rounded-t-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center rounded-t-xl">
                                                            {item.type ===
                                                            'movie' ? (
                                                                <Film className="size-8" />
                                                            ) : (
                                                                <Tv className="size-8" />
                                                            )}
                                                            <span className="mt-1 text-[9px] font-extrabold uppercase">
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Index badge */}
                                                    <span className="border-border bg-background/80 text-foreground absolute top-2 left-2 flex size-6 items-center justify-center rounded-full border text-xs font-bold backdrop-blur-sm">
                                                        {item.order}
                                                    </span>

                                                    {/* Library presence tag */}
                                                    {item.inLibrary && (
                                                        <span className="border-border absolute top-2 right-2 rounded-full border bg-emerald-500 p-1 text-white shadow">
                                                            <Check className="size-2.5 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="bg-card flex flex-1 flex-col justify-between gap-1 p-3">
                                                    <div className="text-foreground line-clamp-2 text-sm font-bold">
                                                        {item.title}
                                                    </div>
                                                    <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                                                        <span className="font-extrabold tracking-wider uppercase">
                                                            {item.type}
                                                        </span>
                                                        {item.releaseDate && (
                                                            <span>
                                                                {new Date(
                                                                    item.releaseDate,
                                                                ).getFullYear()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detail Panel */}
                            <div className="lg:col-span-4">
                                {selectedDetailItem ? (
                                    <Card className="bg-card border-border flex h-full flex-col justify-between border p-5 shadow-md">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border',
                                                        selectedDetailItem.type ===
                                                            'movie'
                                                            ? 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                                                    )}
                                                >
                                                    {selectedDetailItem.type}
                                                </span>
                                                {selectedDetailItem.releaseDate && (
                                                    <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                                                        <Calendar className="size-3" />
                                                        {new Date(
                                                            selectedDetailItem.releaseDate,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-foreground text-xl leading-tight font-bold">
                                                {selectedDetailItem.title}
                                            </h3>

                                            {selectedDetailItem.posterPath && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w300${selectedDetailItem.posterPath}`}
                                                    alt={
                                                        selectedDetailItem.title
                                                    }
                                                    className="border-border aspect-[16/10] w-full rounded-lg border object-cover"
                                                />
                                            )}

                                            {selectedDetailItem.overview && (
                                                <p className="text-muted-foreground max-h-48 overflow-y-auto pr-1 text-sm leading-relaxed font-light select-none">
                                                    {
                                                        selectedDetailItem.overview
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="border-border mt-6 flex items-center justify-between gap-3 border-t pt-4">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDetailItem.inLibrary ? (
                                                    <>
                                                        {selectedDetailItem.libraryStatus !==
                                                            'jellyfin' && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                                                                In Library (
                                                                {
                                                                    selectedDetailItem.libraryStatus
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                        {selectedDetailItem.jellyfinId && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                                                                <span className="size-2 animate-pulse rounded-full bg-purple-500" />
                                                                Jellyfin
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="bg-muted border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                                                        Not Added
                                                    </span>
                                                )}
                                            </div>

                                            {!selectedDetailItem.inLibrary && (
                                                <Button
                                                    size="sm"
                                                    disabled={
                                                        isItemAdding(
                                                            selectedDetailItem,
                                                        ) ||
                                                        (selectedDetailItem.type ===
                                                        'movie'
                                                            ? !isRadarrConfigured
                                                            : !isSonarrConfigured)
                                                    }
                                                    title={
                                                        selectedDetailItem.type ===
                                                        'movie'
                                                            ? !isRadarrConfigured
                                                                ? 'Radarr is not configured'
                                                                : ''
                                                            : !isSonarrConfigured
                                                              ? 'Sonarr is not configured'
                                                              : ''
                                                    }
                                                    onClick={() =>
                                                        addItemToLibrary(
                                                            selectedDetailItem,
                                                        )
                                                    }
                                                    className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isItemAdding(
                                                        selectedDetailItem,
                                                    ) ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Plus className="size-3.5" />
                                                    )}
                                                    Add to{' '}
                                                    {selectedDetailItem.type ===
                                                    'movie'
                                                        ? 'Radarr'
                                                        : 'Sonarr'}
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ) : (
                                    <div className="bg-muted/10 border-border text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed p-8 text-sm">
                                        Select a title from the filmstrip to
                                        view details.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty state */
                <div className="border-border bg-muted/10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                    <Film className="text-muted-foreground mb-4 size-16 animate-bounce stroke-1" />
                    <h2 className="text-foreground text-xl font-bold">
                        No Franchise Loaded
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-sm px-4 text-sm">
                        Search for a movie franchise or select an existing
                        collection from your library to visualize its timeline.
                    </p>
                </div>
            )}
        </div>
    );
}
