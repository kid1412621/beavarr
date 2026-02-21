import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Tabs({
    className,
    orientation = 'horizontal',
    ...props
}: TabsPrimitive.Root.Props) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            data-orientation={orientation}
            className={cn(
                'gap-2 group/tabs flex data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row',
                className,
            )}
            {...props}
        />
    );
}

const tabsListVariants = cva(
    'rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
    {
        variants: {
            variant: {
                default: 'bg-muted',
                line: 'gap-1 bg-transparent',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function TabsList({
    className,
    variant = 'default',
    ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            data-variant={variant}
            className={cn(tabsListVariants({ variant }), className)}
            {...props}
        />
    );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
    return (
        <TabsPrimitive.Tab
            data-slot="tabs-trigger"
            className={cn(
                "gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                'relative inline-flex flex-1 items-center justify-center whitespace-nowrap',
                'text-muted-foreground hover:text-foreground',
                // Horizontal orientation
                'group-data-[orientation=horizontal]/tabs:h-[calc(100%-2px)]',
                // Vertical orientation
                'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
                // Default variant selected state
                'group-data-[variant=default]/tabs-list:aria-selected:bg-background group-data-[variant=default]/tabs-list:aria-selected:text-foreground group-data-[variant=default]/tabs-list:aria-selected:shadow-sm group-data-[variant=default]/tabs-list:aria-selected:border-input/50',
                // Line variant selected state
                'group-data-[variant=line]/tabs-list:aria-selected:text-foreground group-data-[variant=line]/tabs-list:aria-selected:bg-transparent',
                'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity',
                'group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-6px] group-data-[orientation=horizontal]/tabs:after:h-0.5',
                'group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5',
                'group-data-[variant=line]/tabs-list:aria-selected:after:opacity-100',
                // Dark mode specific enhancements
                'dark:aria-selected:bg-muted/50 dark:aria-selected:text-foreground dark:aria-selected:border-border',
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
    return (
        <TabsPrimitive.Panel
            data-slot="tabs-content"
            className={cn('text-sm flex-1 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
