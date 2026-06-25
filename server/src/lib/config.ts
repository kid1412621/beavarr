/**
 * Central server configuration derived from environment variables.
 * Set these in `server/.env` — Bun loads it automatically from the server's CWD.
 */

function parsePositiveInt(
    value: string | undefined,
    defaultValue: number,
): number {
    const parsed = parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export const config = {
    /**
     * Timeout in milliseconds for *arr connection tests (Radarr, Sonarr, etc.).
     * Env var: ARR_CONNECTION_TIMEOUT_MS
     * Default: 5000
     */
    arrConnectionTimeoutMs: parsePositiveInt(
        process.env.ARR_CONNECTION_TIMEOUT_MS,
        5000,
    ),
} as const;
