import { useState, useEffect } from "react";
import { createRootRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Settings } from "lucide-react";
import { settingsQueryOptions } from "@/lib/api";

const navItems = [
    { title: "Home", to: "/", icon: <Home className="size-4" /> },
    { title: "Chat", to: "/chat", icon: <MessageSquare className="size-4" /> },
    { title: "Settings", to: "/settings", icon: <Settings className="size-4" /> },
];

function Root() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { data: settings } = useQuery(settingsQueryOptions);

    const location = useLocation();

    useEffect(() => {
        // Redirect to onboarding if no API key is set, but not if we're already there
        if (settings && !settings.openaiApiKey && !location.pathname.startsWith('/onboarding')) {
            navigate({ to: '/onboarding' });
        }
    }, [settings, navigate, location.pathname]);

    return (
        <div className={cn("h-screen bg-background text-foreground flex flex-col", "font-sans antialiased")}>
            {/* Header - toggle button only on mobile */}
            <header className="h-16 border-b bg-background shrink-0 flex items-center px-4 gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden relative group"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <div className={cn("absolute transition-all duration-300 transform", sidebarOpen ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                            <line x1="3" x2="21" y1="6" y2="6" />
                            <line x1="3" x2="21" y1="12" y2="12" />
                            <line x1="3" x2="21" y1="18" y2="18" />
                        </svg>
                    </div>
                    <div className={cn("absolute transition-all duration-300 transform", sidebarOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </div>
                </Button>
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/beaver.svg" alt="Beavarr Logo" className="size-4" />
                    <span className="font-semibold text-lg">Beavarr</span>
                </Link>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile sidebar overlay */}
                <div
                    className={cn(
                        "fixed inset-0 top-16 bg-black/50 z-40 transition-opacity duration-200 lg:hidden",
                        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setSidebarOpen(false)}
                />
                <aside
                    className={cn(
                        "fixed bottom-0 left-0 top-16 z-50 w-1/2 bg-sidebar border-r flex flex-col transition-transform duration-200",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                        "lg:static lg:w-[200px] lg:translate-x-0 lg:h-full lg:shrink-0 lg:z-auto"
                    )}
                >
                    <div className="p-[10px] flex-1 flex flex-col h-full">
                        <Sidebar items={navItems} onItemClick={() => setSidebarOpen(false)} />
                    </div>
                </aside>

                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
            <TanStackRouterDevtools />
        </div>
    );
}

export const Route = createRootRoute({
    component: Root,
});
