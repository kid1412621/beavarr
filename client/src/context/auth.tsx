import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';

import { client } from '@/lib/api';
import { router } from '@/router';

interface User {
    username: string;
    isPasswordChanged: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Remove hooks
    // const navigate = useNavigate();
    // const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const credentials = localStorage.getItem('auth_credentials');
            if (!credentials) {
                setIsLoading(false);
                const path = router.state.location.pathname;
                if (path !== '/login') {
                    // router.navigate({ to: '/login' });
                }
                return;
            }

            // Verify token
            try {
                const res = await client.api.auth.verify.$post();
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    // Invalid token
                    localStorage.removeItem('auth_credentials');
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth verification failed', error);
                localStorage.removeItem('auth_credentials');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        const credentials = btoa(`${username}:${password}`);
        // Temporarily set for the request
        localStorage.setItem('auth_credentials', credentials);

        try {
            const res = await client.api.auth.verify.$post();
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                // navigate({ to: '/' }); // Let component handle nav
            } else {
                localStorage.removeItem('auth_credentials');
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            localStorage.removeItem('auth_credentials');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_credentials');
        setUser(null);
        router.navigate({ to: '/login' });
    };

    const changePassword = async (newPassword: string) => {
        const res = await client.api.auth['change-password'].$post({
            json: { newPassword },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to change password');
        }

        // Update user state locally to reflect password change
        if (user) {
            setUser({ ...user, isPasswordChanged: true });
        }

        // Update stored credentials with new password (?)
        // Wait, if we change password, the old credentials (basic auth header) will be invalid for next requests?
        // Yes. So we need to update the stored credentials with the NEW password.
        // We know the username from current state.
        if (user) {
            const credentials = btoa(`${user.username}:${newPassword}`);
            localStorage.setItem('auth_credentials', credentials);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                changePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
