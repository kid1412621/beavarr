import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/trakt_callback")({
    component: TraktCallback,
});

type Status = "loading" | "error" | "missing-data" | "failed" | "success";

interface State {
    status: Status;
    message?: string;
}

function TraktCallback() {
    const navigate = useNavigate();
    const [state, setState] = useState<State>({ status: "loading" });
    const SERVER_URL = import.meta.env.DEV ? "http://localhost:4242" : "/";

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const queryError = params.get("error");
    const queryState = params.get("state");

    useEffect(() => {
        if (queryError) {
            setState({ status: "error", message: queryError });
            return;
        }

        if (!code || !queryState) {
            setState({ status: "missing-data" });
            return;
        }

        // Call server API to exchange code for tokens
        fetch(`${SERVER_URL}/api/trakt/callback?code=${code}&state=${queryState}`, {
            method: "GET",
            credentials: "include", // Send cookies for state validation
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setState({ status: "success" });
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        navigate({ to: "/settings" });
                    }, 2000);
                } else if (data.error) {
                    setState({
                        status: "failed",
                        message: data.error,
                    });
                } else {
                    throw new Error("Unexpected response from server");
                }
            })
            .catch((err) => {
                setState({
                    status: "failed",
                    message: err instanceof Error ? err.message : "Unknown error",
                });
            });
    }, [code, queryState, queryError, navigate]);

    if (state.status === "error") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-full max-w-md p-8">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                        Authorization Failed
                    </h1>
                    <p className="text-muted-foreground mb-6">Error: {state.message}</p>
                    <a href="/settings" className="text-primary hover:underline">
                        Return to Settings
                    </a>
                </div>
            </div>
        );
    }

    if (state.status === "missing-data") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-full max-w-md p-8">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                        Missing Authorization Data
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Authorization code or state is missing.
                    </p>
                    <a href="/settings" className="text-primary hover:underline">
                        Return to Settings
                    </a>
                </div>
            </div>
        );
    }

    if (state.status === "failed") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-full max-w-md p-8">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                        Connection Failed
                    </h1>
                    <p className="text-muted-foreground mb-6">{state.message}</p>
                    <a href="/settings" className="text-primary hover:underline">
                        Return to Settings
                    </a>
                </div>
            </div>
        );
    }

    if (state.status === "success") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-full max-w-md p-8 text-center">
                    <h1 className="text-2xl font-bold text-green-600 mb-4">
                        Successfully Connected!
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        Trakt has been connected to your account.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Redirecting to settings...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Connecting to Trakt...</h1>
                <p className="text-muted-foreground">
                    Redirecting to complete authorization...
                </p>
            </div>
        </div>
    );
}
