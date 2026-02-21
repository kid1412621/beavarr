import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth';
import { router } from '@/router';

const queryClient = new QueryClient();

export default function App() {
    return (
        <StrictMode>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <RouterProvider router={router} />
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </StrictMode>
    );
}
