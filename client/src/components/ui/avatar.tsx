import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full size-8',
                className,
            )}
            {...props}
        />
    );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn(
                'aspect-square h-full w-full object-cover',
                className,
            )}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    ...props
}: AvatarPrimitive.Fallback.Props) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium text-xs',
                className,
            )}
            {...props}
        />
    );
}

export { Avatar, AvatarImage, AvatarFallback };
