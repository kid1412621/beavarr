# Core Guidelines

## Code Style

- Use **Oxc** for linting (`oxlint`) and formatting (`oxfmt`).
- Linter configuration: `.oxlintrc.json`.
- Formatter configuration: `.oxfmtrc.json`.
- TypeScript strict mode enabled.
- Follow existing patterns in each workspace.
- Shared configuration for consistent code style across the monorepo.
- Use native Oxc configs over Prettier/ESLint configs where possible.
- Never use deprecated APIs, e.g. `z.string().url()` which is old version of zod, use `z.url()` instead

## Type Safety Philosophy

- End-to-end type safety is a core principle
- API request/response types should be defined in shared package
- Both client and server should reference the same type definitions
- TypeScript path aliases enable clean imports
- Avoid type assertions (`as`) unless absolutely necessary

## Shared Types

- All shared types live in `shared/src/types/`
- Export types from `shared/src/index.ts` for accessibility
- Import shared types using: `import { TypeName } from "shared"`
- Run `bun run dev` or `bun run build` in the shared package to compile exports
- Both client and server should import from the compiled shared package
