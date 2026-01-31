import { useState, useRef, useLayoutEffect } from "react";
import { Film } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { client, settingsQueryOptions } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "shared";

const POSTER_WIDTH = 200; // px

function PosterImage({ src, className }: { src?: string; className?: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useLayoutEffect(() => {
        if (imgRef.current?.complete) {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className={cn("relative w-full h-full bg-gray-800 overflow-hidden", className)}>
            {/* Loading Skeleton */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 animate-pulse z-10" />
            )}

            {/* Image */}
            {src && !hasError && !src.includes("placehold.co") ? (
                <img
                    ref={imgRef}
                    src={src}
                    alt="Poster"
                    className={cn(
                        "w-full h-full object-cover transition-all duration-700 ease-in-out",
                        isLoading ? "scale-110 blur-md opacity-0" : "scale-100 blur-0 opacity-100"
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setHasError(true);
                        setIsLoading(false);
                    }}
                    loading="lazy"
                    decoding="async"
                />
            ) : null}

            {/* Fallback */}
            {(hasError || !src || src.includes("placehold.co")) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 p-4 text-center z-0">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 animate-in fade-in zoom-in duration-300">
                        <Film className="w-6 h-6 text-white/20" />
                    </div>
                    <span className="text-xs font-medium text-white/30 tracking-wider">NO IMAGE</span>
                </div>
            )}
        </div>
    );
}

function PosterRow({
    posters,
    speed = 20,
    reverse = false,
}: { posters: string[]; speed?: number; reverse?: boolean }) {
    // Duplicate posters to ensure smooth loop
    const displayPosters = posters.length < 50 ? [...posters, ...posters, ...posters, ...posters] : posters;

    return (
        <div
            className="flex gap-4 overflow-hidden py-2"
            style={{
                maskImage:
                    "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
        >
            <div
                className="flex gap-4 shrink-0"
                style={{
                    animation: `scroll${reverse ? "-reverse" : ""} ${speed}s linear infinite`,
                }}
            >
                {displayPosters.map((url, i) => (
                    <div
                        key={i}
                        className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 bg-gray-800 shrink-0 transform-gpu"
                        style={{ width: `${POSTER_WIDTH}px` }}
                    >
                        <PosterImage src={url} key={url} />
                    </div>
                ))}
            </div>
            <style>
                {`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    @keyframes scroll-reverse {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                `}
            </style>
        </div>
    );
}

export function PosterWall() {
    const { data: settings } = useQuery(settingsQueryOptions);
    const source = settings?.posterSource || 'history';

    const { data: posters } = useQuery({
        queryKey: ["poster-wall", source],
        queryFn: async () => {
            let res;
            if (source === 'trending') {
                res = await client.api.trakt.trending.$get();
            } else if (source === 'library') {
                res = await client.api.library.$get();
            } else {
                res = await client.api.trakt.history.$get({ query: { limit: "100" } });
            }
            if (!res.ok) throw new Error("Failed to fetch posters");
            return res.json();
        },
        enabled: !!settings
    });

    // Extract valid poster URLs
    const posterUrls = (posters || [])
        .map((item: LibraryItem) => item.poster_url)
        .filter((url: string | null) => !!url) as string[];

    // Distribute posters round-robin to ensure unique content per row
    const rows: string[][] = [[], [], []];

    if (posterUrls.length > 0) {
        posterUrls.forEach((url, i) => {
            rows[i % 3].push(url);
        });
    } else {
        // Fallback if no history
        rows[0] = Array(10).fill("");
        rows[1] = Array(10).fill("");
        rows[2] = Array(10).fill("");
    }

    // Ensure each row has enough items for smooth scrolling
    const [row1, row2, row3] = rows.map(row => {
        if (row.length === 0) return Array(10).fill("");
        let filled = [...row];
        while (filled.length < 10) {
            filled = [...filled, ...row];
        }
        return filled;
    });

    // Ensure rows are dense enough
    const fill = (arr: string[]) => arr;

    return (
        <div className="absolute inset-0 flex flex-col justify-center opacity-50 blur-[2px] scale-110 pointer-events-none select-none">
            <PosterRow posters={fill(row1)} speed={60} />
            <PosterRow posters={fill(row2)} speed={70} reverse />
            <PosterRow posters={fill(row3)} speed={80} />
        </div>
    );
}
