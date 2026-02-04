# AGENTS.md

## Project Overview

Beavarr is a full-stack TypeScript monorepo project using Bun, Hono, Vite, and React. The project emphasizes type safety between client and server through shared type definitions, with a focus on flexibility for deployment in any environment.

**Key Technologies:**

- Runtime: Bun
- Backend: Hono + [Langchain](https://docs.langchain.com/llms.txt) + [Drizzle](https://orm.drizzle.team/llms-full.txt) + SQLite
- Frontend: Vite + React + [Shadcn UI](https://ui.shadcn.com/llms.txt)
- Build orchestration: Turbo
- Linting/Formatting: Oxc (Oxlint & Oxfmt)
- Language: TypeScript

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

## Development Guidelines

### Shared Types

- All shared types live in `shared/src/types/`
- Export types from `shared/src/index.ts` for accessibility
- Import shared types using: `import { TypeName } from "shared"`
- Run `bun run dev` or `bun run build` in the shared package to compile exports
- Both client and server should import from the compiled shared package

### Code Style

- Use **Oxc** for linting (`oxlint`) and formatting (`oxfmt`).
- Linter configuration: `.oxlintrc.json`.
- Formatter configuration: `.oxfmtrc.json`.
- TypeScript strict mode enabled.
- Follow existing patterns in each workspace.
- Shared configuration for consistent code style across the monorepo.
- Use native Oxc configs over Prettier/ESLint configs where possible.
- Never use deprecated APIs, e.g. `z.string().url()` which is old version of zod, use `z.url()` instead

### Server Development (Hono)

- Server entry point: `server/src/index.ts`
- Hono provides Express-like API for route definitions
- Use typed responses with shared types for API contracts
- Enable CORS for local development
- Databases using ORMs like Drizzle

### Client Development (React + Vite)

- Client entry: `client/src/main.tsx`
- Standard Vite + React TypeScript setup
- Can integrate UI libraries like shadcn/ui
- Can add routing with React Router
- Configure `VITE_SERVER_URL` environment variable for API endpoint
- Fetch API responses should be typed using shared types

### Adding New Packages

When adding workspace packages:

- Create appropriate `package.json` with workspace references
- Add proper `tsconfig.json` extending from root config
- Update root `package.json` workspaces field if needed
- Register scripts in `turbo.json` for build orchestration
- Follow existing package structure patterns

## Testing Strategy

- Test files should be colocated with source files or in `__tests__` directories
- Use appropriate testing frameworks for each workspace
- Ensure tests pass before committing: `bun run test`
- Type checking is part of the testing pipeline

## Build Process

- Turbo handles build orchestration and caching
- Shared package must be built before client/server
- Build order is managed automatically by Turbo based on dependencies
- Turbo caches build outputs for faster subsequent builds
- Remote caching can be enabled through Vercel for team collaboration

## Type Safety Philosophy

- End-to-end type safety is a core principle
- API request/response types should be defined in shared package
- Both client and server should reference the same type definitions
- TypeScript path aliases enable clean imports
- Avoid type assertions (`as`) unless absolutely necessary

## Common Workflows

### Adding a New API Endpoint

1. Define request/response types in `shared/src/types/`
2. Export types from `shared/src/index.ts`
3. Build shared package: `cd shared && bun run build`
4. Implement endpoint in `server/src/index.ts` using shared types
5. Update client to consume endpoint with proper typing

### Adding a New UI Component

1. Create component in `client/src/components/`
2. Import and use in relevant pages
3. Use shared types for any data structures
4. Ensure component follows existing style patterns

### Updating Shared Types

1. Modify types in `shared/src/types/`
2. Rebuild shared package: `cd shared && bun run build`
3. Update affected client/server code
4. Run type checking: `bun run type-check`

## Docker Support

The repository includes a `Dockerfile` for containerized deployment. Use standard Docker commands:

- Build: `bun run build:docker` or `docker build -t beavarr .`
- Run: `bun run run:docker` or `docker run -p 4242:4242 beavarr`
