# Frontend Guidelines

## Client Development (React + Vite)

- Client entry: `client/src/main.tsx`
- Standard Vite + React TypeScript setup
- Can integrate UI libraries like shadcn/ui
- Can add routing with React Router
- Configure `VITE_SERVER_URL` environment variable for API endpoint
- Fetch API responses should be typed using shared types
- **Mobile-First Responsive Design Principles:**
    - Always design layouts with mobile devices in mind. Avoid hardcoded `grid-cols-N` or fixed widths (`w-[300px]`, etc.) without screen-size prefixes. Use responsive classes like `grid-cols-1 sm:grid-cols-2`.
    - For side-by-side buttons or headers, use stacked layouts on mobile (`flex-col sm:flex-row`), adding `w-full sm:w-auto` to interactive components for better tap target size and accessibility.
    - When inputs feature absolute-positioned elements (such as paste buttons or helper links), always provide sufficient right padding (e.g., `pr-10`) to prevent text from overlapping with the icons.
    - Ensure parent card and container paddings are responsive (e.g., `px-4 sm:px-8`) to maximize the available screen space on narrow viewports.
    - Ensure labels, text badges, and tab headers wrap or shrink gracefully, or display shorter alternative text on mobile (e.g. using `hidden sm:inline` and `sm:hidden`).

## Adding a New UI Component

1. Create component in `client/src/components/`
2. Import and use in relevant pages
3. Use shared types for any data structures
4. Ensure component follows existing style patterns
