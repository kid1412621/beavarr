# Backend Guidelines

## Server Development (Hono)

- Server entry point: `server/src/index.ts`
- Hono provides Express-like API for route definitions
- Use typed responses with shared types for API contracts
- Enable CORS for local development
- Databases using ORMs like Drizzle

## Adding a New API Endpoint

1. Define request/response types in `shared/src/types/`
2. Export types from `shared/src/index.ts`
3. Build shared package: `cd shared && bun run build`
4. Implement endpoint in `server/src/index.ts` using shared types
5. Update client to consume endpoint with proper typing
