
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Clipboard } from 'lucide-react'

export function SonarrSettings({ form }: { form: any }) {
    const pasteFromClipboard = async (field: any) => {
        try {
            const text = await navigator.clipboard.readText()
            field.handleChange(text)
        } catch (err) {
            console.error('Failed to read clipboard', err)
        }
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            <form.Field
                name="sonarrUrl"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Sonarr URL</Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="http://localhost:8989"
                            />
                            {field.state.value && (
                                <a
                                    href={`${field.state.value.replace(/\/$/, '')}/settings/general`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title="Get API key"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                        {field.state.meta.touchedErrors?.length > 0 && (
                            <em className="text-red-500 text-xs">
                                {field.state.meta.touchedErrors.join(', ')}
                            </em>
                        )}
                    </div>
                )}
            />
            <form.Field
                name="sonarrApiKey"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Sonarr API Key</Label>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => pasteFromClipboard(field)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title="Paste from clipboard"
                            >
                                <Clipboard className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            />
        </div>
    )
}
