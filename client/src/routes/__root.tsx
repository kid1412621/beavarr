import { useQuery } from '@tanstack/react-query';
import {
    createRootRoute,
    Link,
    Outlet,
    useNavigate,
    useLocation,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Home, MessageSquare, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { settingsQueryOptions } from '@/lib/api';
import { cn } from '@/lib/utils';

const navItems = [
    { title: 'Home', to: '/', icon: <Home className="size-4" /> },
    { title: 'Chat', to: '/chat', icon: <MessageSquare className="size-4" /> },
    {
        title: 'Settings',
        to: '/settings',
        icon: <Settings className="size-4" />,
    },
];

import { useAuth } from '@/hooks/use-auth';

function Root() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const { data: settings } = useQuery({
        ...settingsQueryOptions,
        enabled: isAuthenticated,
    });

    const location = useLocation();

    useEffect(() => {
        if (isLoading) return;

        const path = location.pathname;

        // 1. Unauthenticated -> Login
        if (!isAuthenticated) {
            if (path !== '/login') {
                navigate({ to: '/login' });
            }
            return;
        }

        // 2. Authenticated but Password Change Required -> Change Password
        if (!user?.isPasswordChanged) {
            if (path !== '/change-password') {
                navigate({ to: '/change-password' });
            }
            return;
        }

        // 3. Authenticated & Password Changed & No API Key -> Onboarding
        if (settings && !settings.openaiApiKey) {
            if (!path.startsWith('/onboarding')) {
                navigate({ to: '/onboarding', search: { step: 1 } });
            }
        }
    }, [
        settings,
        navigate,
        location.pathname,
        isAuthenticated,
        isLoading,
        user,
    ]);

    if (isLoading)
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );

    // If on login page, render only Outlet (no sidebar)
    if (location.pathname === '/login') {
        return (
            <>
                <Outlet />
                <Toaster />
            </>
        );
    }

    // If on change-password page, render only Outlet (no sidebar) - or keep sidebar?
    // Probably better to keep it simple.
    if (location.pathname === '/change-password') {
        return (
            <>
                <Outlet />
                <Toaster />
            </>
        );
    }

    // If not authenticated (should be handled by effect, but as guard)
    if (!isAuthenticated) return null;

    return (
        <>
            <div
                className={cn(
                    'h-screen bg-background text-foreground flex flex-col',
                    'font-sans antialiased',
                )}
            >
                {/* Header - toggle button only on mobile */}
                <header className="bg-background flex h-16 shrink-0 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="group relative lg:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <div
                                className={cn(
                                    'absolute transition-all duration-300 transform',
                                    sidebarOpen
                                        ? 'rotate-90 opacity-0 scale-0'
                                        : 'rotate-0 opacity-100 scale-100',
                                )}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5"
                                >
                                    <line x1="3" x2="21" y1="6" y2="6" />
                                    <line x1="3" x2="21" y1="12" y2="12" />
                                    <line x1="3" x2="21" y1="18" y2="18" />
                                </svg>
                            </div>
                            <div
                                className={cn(
                                    'absolute transition-all duration-300 transform',
                                    sidebarOpen
                                        ? 'rotate-0 opacity-100 scale-100'
                                        : '-rotate-90 opacity-0 scale-0',
                                )}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </div>
                        </Button>
                        <Link
                            to="/"
                            className="flex items-center gap-2 transition-opacity hover:opacity-80"
                        >
                            <img
                                src="/beaver.svg"
                                alt="Beavarr Logo"
                                className="size-4"
                            />
                            <span className="text-lg font-semibold">
                                Beavarr
                            </span>
                        </Link>
                    </div>
                    <Button variant="ghost" onClick={logout}>
                        Logout
                    </Button>
                </header>

                <div className="relative flex flex-1 overflow-hidden">
                    {/* Mobile sidebar overlay */}
                    <div
                        className={cn(
                            'fixed inset-0 top-16 bg-black/50 z-40 transition-opacity duration-200 lg:hidden',
                            sidebarOpen
                                ? 'opacity-100'
                                : 'opacity-0 pointer-events-none',
                        )}
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside
                        className={cn(
                            'fixed bottom-0 left-0 top-16 z-50 w-1/2 bg-sidebar border-r flex flex-col transition-transform duration-200',
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                            'lg:static lg:w-[200px] lg:translate-x-0 lg:h-full lg:shrink-0 lg:z-auto',
                        )}
                    >
                        <div className="flex h-full flex-1 flex-col p-[10px]">
                            <Sidebar
                                items={navItems}
                                onItemClick={() => setSidebarOpen(false)}
                            />
                        </div>
                    </aside>

                    <main className="flex-1 overflow-auto">
                        <Outlet />
                    </main>
                </div>
                <TanStackRouterDevtools />
            </div>
            <Toaster />
        </>
    );
}

export const Route = createRootRoute({
    component: Root,
});
