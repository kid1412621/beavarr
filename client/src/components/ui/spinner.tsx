import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Spinner({
    className,
    ...props
}: React.ComponentProps<typeof Loader2>) {
    return (
        <Loader2
            data-slot="spinner"
            className={cn('animate-spin size-4', className)}
            {...props}
        />
    );
}

export { Spinner };
