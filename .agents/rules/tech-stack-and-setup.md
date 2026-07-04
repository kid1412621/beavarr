# Tech Stack and Setup

## Monorepo Structure

```
.
├── client/               # React frontend (Vite)
├── server/               # Hono backend
├── shared/               # Shared TypeScript definitions
│   └── src/types/        # Type definitions for client & server
├── .oxlintrc.json        # Oxc linter configuration
├── .oxfmtrc.json         # Oxc formatter configuration
├── package.json          # Root package with workspaces
├── turbo.json           # Turbo build configuration
└── .github/workflows/    # CI/CD workflows
```

## Setup Commands

- Install dependencies: `bun install`
- Start dev servers (all): `bun run dev`
- Start client only: `bun run dev:client`
- Start server only: `bun run dev:server`
- Build all packages: `bun run build`
- Build client: `bun run build:client`
- Build server: `bun run build:server`
- Lint all packages: `bun run lint` (using `oxlint`)
- Format code: `bun run format` (using `oxfmt`)
- Type check: `bun run type-check`
- Run tests: `bun run test`

## Docker Support

The repository includes a `Dockerfile` for containerized deployment. Use standard Docker commands:

- Build: `bun run build:docker` or `docker build -t beavarr .`
- Run: `bun run run:docker` or `docker run -p 4242:4242 beavarr`
