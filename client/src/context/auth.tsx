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
            // No need to check localStorage. Just try to verify.
            // If the auth_token cookie is there and valid, the server will return the user.
            try {
                const res = await client.api.auth.verify.$post();
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth verification failed', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        const credentials = btoa(`${username}:${password}`);

        // We send the Basic Auth header ONCE during login.
        // The server will verify it and set an HttpOnly auth_token cookie.
        const res = await client.api.auth.verify.$post(
            {},
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                },
            },
        );

        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
        } else {
            throw new Error('Invalid credentials');
        }
    };

    const logout = async () => {
        try {
            await client.api.auth.logout.$post();
        } catch (error) {
            console.error('Logout failed on server', error);
        }
        setUser(null);
        router.navigate({ to: '/login' });
    };

    const changePassword = async (newPassword: string) => {
        const res = await client.api.auth['change-password'].$post({
            json: { newPassword },
        });

        if (!res.ok) {
            const data = await res.json();
            const message = 'error' in data ? data.error : 'Failed to change password';
            throw new Error(message);
        }

        // Update user state locally to reflect password change
        if (user) {
            setUser({ ...user, isPasswordChanged: true });
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
