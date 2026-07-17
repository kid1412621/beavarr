# Beavarr Project Guidelines

Beavarr is a full-stack TypeScript monorepo project using Bun, Hono, Vite, and React. The project emphasizes type safety between client and server through shared type definitions, with a focus on flexibility for deployment in any environment.

**Key Technologies:**

- Runtime: [Bun](https://bun.com/llms-rules.txt)
- Backend: [Hono](https://hono.dev/llms.txt) + [Langchain](https://docs.langchain.com/llms.txt) + [Drizzle](https://orm.drizzle.team/llms-full.txt) + SQLite
- Frontend: [Vite](https://vitejs.dev/llms.txt) + [React](https://react.dev/llms.txt) + [Tanstack](https://tanstack.com/llms.txt) + [Shadcn UI](https://ui.shadcn.com/llms.txt) + [Base UI](https://base-ui.com/llms.txt)
- Build orchestration: [Turbo](https://turbo.build/llms.txt)
- Linting/Formatting: [Oxc](https://oxc.rs/llms.txt) (Oxlint & Oxfmt)
- Language: TypeScript 7

## Index of Rules

The detailed rules and guidelines have been split into the following domain-specific files to keep context loading efficient:

- [Tech Stack and Setup](./.agents/rules/tech-stack-and-setup.md): Project Overview, Monorepo Structure, Setup Commands, and Docker Support.
- [Core Guidelines](./.agents/rules/core-guidelines.md): Code Style, Type Safety Philosophy, and Shared Types conventions.
- [Frontend Guidelines](./.agents/rules/frontend-guidelines.md): Client Development (React + Vite), Mobile-First principles, and Adding a New UI Component.
- [Backend Guidelines](./.agents/rules/backend-guidelines.md): Server Development (Hono) and Adding a New API Endpoint.
- [Workflows and Operations](./.agents/rules/workflows-and-ops.md): Adding New Packages, Testing Strategy, Build Process, and Updating Shared Types.
- [Integration Services](./.agents/rules/integration-services.md): API documentation links for external services (Jellyfin, Radarr, Sonarr, Trakt, TMDB, TVDB, OMDB).
