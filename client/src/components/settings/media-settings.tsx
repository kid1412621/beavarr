
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clipboard } from 'lucide-react'

export function MediaSettings({ form }: { form: any }) {
    const pasteFromClipboard = async (field: any) => {
        try {
            const text = await navigator.clipboard.readText()
            field.handleChange(text)
        } catch (err) {
            console.error('Failed to read clipboard', err)
        }
    }

    return (
        <div className="space-y-4">
            <form.Field
                name="tmdbApiKey"
                children={(field: any) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>TMDB API Key</Label>
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
