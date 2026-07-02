import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/trakt_callback')({
    component: TraktCallback,
});

type Status = 'loading' | 'error' | 'missing-data' | 'failed' | 'success';

interface State {
    status: Status;
    message?: string;
}

function TraktCallback() {
    const navigate = useNavigate();
    const [state, setState] = useState<State>({ status: 'loading' });
    const SERVER_URL = import.meta.env.DEV ? 'http://localhost:4242' : '/';

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const queryError = params.get('error');
    const queryState = params.get('state');

    useEffect(() => {
        if (queryError) {
            setState({ status: 'error', message: queryError });
            return;
        }

        if (!code || !queryState) {
            setState({ status: 'missing-data' });
            return;
        }

        // Call server API to exchange code for tokens
        fetch(
            `${SERVER_URL}/api/trakt/callback?code=${code}&state=${queryState}`,
            {
                method: 'GET',
                credentials: 'include', // Send cookies for state validation
            },
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setState({ status: 'success' });
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        navigate({ to: '/settings' });
                    }, 2000);
                } else if (data.error) {
                    setState({
                        status: 'failed',
                        message: data.error,
                    });
                } else {
                    throw new Error('Unexpected response from server');
                }
            })
            .catch((err) => {
                setState({
                    status: 'failed',
                    message:
                        err instanceof Error ? err.message : 'Unknown error',
                });
            });
    }, [code, queryState, queryError, navigate, SERVER_URL]);

    if (state.status === 'error') {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive text-2xl">
                            Authorization Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Alert variant="destructive">
                            <AlertDescription>
                                Error: {state.message}
                            </AlertDescription>
                        </Alert>
                        <Link to="/settings" className="w-full">
                            <Button className="w-full" variant="outline">
                                Return to Settings
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (state.status === 'missing-data') {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive text-2xl">
                            Missing Authorization Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Alert variant="destructive">
                            <AlertDescription>
                                Authorization code or state is missing.
                            </AlertDescription>
                        </Alert>
                        <Link to="/settings" className="w-full">
                            <Button className="w-full" variant="outline">
                                Return to Settings
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (state.status === 'failed') {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive text-2xl">
                            Connection Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Alert variant="destructive">
                            <AlertDescription>{state.message}</AlertDescription>
                        </Alert>
                        <Link to="/settings" className="w-full">
                            <Button className="w-full" variant="outline">
                                Return to Settings
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (state.status === 'success') {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Successfully Connected!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-muted-foreground">
                            Trakt has been connected to your account.
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Redirecting to settings...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Connecting to Trakt...
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-muted-foreground">
                        Redirecting to complete authorization...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
