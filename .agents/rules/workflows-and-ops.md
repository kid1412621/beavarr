# Workflows and Operations

## Adding New Packages

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

## Updating Shared Types

1. Modify types in `shared/src/types/`
2. Rebuild shared package: `cd shared && bun run build`
3. Update affected client/server code
4. Run type checking: `bun run type-check`
