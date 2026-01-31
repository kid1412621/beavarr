import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, Clapperboard, TvMinimalPlay } from "lucide-react";
import { PosterWall } from "@/components/poster-wall";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-purple-500/30">
			{/* Background Wall */}
			<PosterWall />

			{/* Gradient Overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20 pointer-events-none" />

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center gap-8 text-center animate-fade-in-up">
				<div className="space-y-2">
					<h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground drop-shadow-2xl">
						bhvr
					</h1>
					<p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
						Your Personal Media Agent
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
					<Link to="/chat">
						<Button
							size="lg"
							className="rounded-full px-8 h-14 text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
						>
							<MessageSquare className="mr-3 w-5 h-5" />
							Start Chat
						</Button>
					</Link>

					<Link to="/settings">
						<Button
							size="lg"
							variant="outline"
							className="rounded-full px-8 h-14 text-lg transition-all hover:scale-105 bg-background/50 backdrop-blur-sm"
						>
							<Settings className="mr-3 w-5 h-5" />
							Settings
						</Button>
					</Link>

					<a href="https://sonarr.tv" target="_blank" rel="noopener noreferrer">
						<Button
							size="icon"
							variant="ghost"
							className="w-14 h-14 rounded-full transition-all hover:scale-110"
							title="Go to Sonarr"
						>
							<TvMinimalPlay className="w-6 h-6" />
						</Button>
					</a>

					<a href="https://radarr.video" target="_blank" rel="noopener noreferrer">
						<Button
							size="icon"
							variant="ghost"
							className="w-14 h-14 rounded-full transition-all hover:scale-110"
							title="Go to Radarr"
						>
							<Clapperboard className="w-6 h-6" />
						</Button>
					</a>
				</div>
			</div>

			{/* Footer */}
			<div className="absolute bottom-6 text-muted-foreground text-sm font-medium tracking-widest uppercase opacity-60">
				Trakt • Sonarr • Radarr • Jellyfin
			</div>
		</div>
	);
}

export default Index;
