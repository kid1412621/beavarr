import { createFileRoute, Link } from '@tanstack/react-router';
import {
    MessageSquare,
    Settings,
    Clapperboard,
    TvMinimalPlay,
} from 'lucide-react';

import { PosterWall } from '@/components/poster-wall';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({
    component: Index,
});

function Index() {
    return (
        <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Background Wall */}
            <PosterWall />

            {/* Gradient Overlay */}
            <div className="from-background via-background/80 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t" />

            {/* Content */}
            <div className="animate-fade-in-up relative z-10 flex flex-col items-center gap-8 text-center">
                <div className="space-y-2">
                    <h1 className="from-foreground to-muted-foreground bg-gradient-to-br bg-clip-text text-7xl font-black tracking-tighter text-transparent drop-shadow-2xl md:text-9xl">
                        bhvr
                    </h1>
                    <p className="text-muted-foreground text-xl font-light tracking-wide md:text-2xl">
                        Your Personal Media Agent
                    </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link to="/chat">
                        <Button
                            size="lg"
                            className="h-14 rounded-full px-8 text-lg shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <MessageSquare className="mr-3 h-5 w-5" />
                            Start Chat
                        </Button>
                    </Link>

                    <Link to="/settings">
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-background/50 h-14 rounded-full px-8 text-lg backdrop-blur-sm transition-all hover:scale-105"
                        >
                            <Settings className="mr-3 h-5 w-5" />
                            Settings
                        </Button>
                    </Link>

                    <a
                        href="https://sonarr.tv"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-14 w-14 rounded-full transition-all hover:scale-110"
                            title="Go to Sonarr"
                        >
                            <TvMinimalPlay className="h-6 w-6" />
                        </Button>
                    </a>

                    <a
                        href="https://radarr.video"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-14 w-14 rounded-full transition-all hover:scale-110"
                            title="Go to Radarr"
                        >
                            <Clapperboard className="h-6 w-6" />
                        </Button>
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div className="text-muted-foreground absolute bottom-6 text-sm font-medium tracking-widest uppercase opacity-60">
                Trakt • Sonarr • Radarr • Jellyfin
            </div>
        </div>
    );
}

export default Index;
