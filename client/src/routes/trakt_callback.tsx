import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/trakt_callback')({
    component: TraktCallback,
})

function TraktCallback() {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    useEffect(() => {
        if (error) {
            document.body.innerHTML = `
                <div style="padding: 2rem; font-family: system-ui; max-width: 500px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">Authorization Failed</h1>
                    <p>Error: ${error}</p>
                    <a href="/settings" style="color: #2563eb;">Return to Settings</a>
                </div>
            `
            return
        }

        if (!code || !state) {
            document.body.innerHTML = `
                <div style="padding: 2rem; font-family: system-ui; max-width: 500px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">Missing Authorization Data</h1>
                    <p>Authorization code or state is missing.</p>
                    <a href="/settings" style="color: #2563eb;">Return to Settings</a>
                </div>
            `
            return
        }

        // Call server API to exchange code for tokens
        const serverUrl = import.meta.env.PROD ? '' : 'http://localhost:4242'
        fetch(`${serverUrl}/api/trakt/callback?code=${code}&state=${state}`, {
            method: 'GET',
            credentials: 'include',  // Send cookies for state validation
        }).then(res => {
            if (res.ok) {
                document.body.innerHTML = `
                    <div style="padding: 2rem; font-family: system-ui; max-width: 500px; margin: 0 auto; text-align: center;">
                        <h1 style="color: #16a34a;">Successfully Connected!</h1>
                        <p>Trakt has been connected to your account.</p>
                        <meta http-equiv="refresh" content="2;url=/settings" />
                    </div>
                `
            } else {
                throw new Error('Failed to connect')
            }
        }).catch(err => {
            document.body.innerHTML = `
                <div style="padding: 2rem; font-family: system-ui; max-width: 500px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">Connection Failed</h1>
                    <p>${err.message}</p>
                    <a href="/settings" style="color: #2563eb;">Return to Settings</a>
                </div>
            `
        })
    }, [])

    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Connecting to Trakt...</h1>
            <p className="text-muted-foreground">Redirecting to complete authorization...</p>
        </div>
    )
}
