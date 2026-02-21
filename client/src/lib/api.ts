import { queryOptions } from '@tanstack/react-query';
import { hcWithType } from 'server/dist/client';

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:4242' : '/';

export const client = hcWithType(SERVER_URL, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
            ...init,
            credentials: 'include',
        }),
});

export const settingsQueryOptions = queryOptions({
    queryKey: ['settings'],
    queryFn: async () => {
        const res = await client.api.settings.$get();
        if (!res.ok) throw new Error('Failed to fetch settings');
        const settings = await res.json();
        return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
});
