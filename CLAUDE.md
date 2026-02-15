# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beavarr is an AI-powered media management application with a monorepo structure (Bun, Hono, Vite, React). The app uses an AI agent (LangChain + OpenAI) to search and add movies/shows to Sonarr/Radarr via chat.

## Common Commands

```bash
bun install              # Install dependencies
bun run dev              # Run all workspaces (client + server)
bun run dev:client       # Client only (Vite on ~5173)
bun run dev:server       # Server only (Hono on 4242)
bun run build            # Build all packages
bun run build:single     # Build all + copy client dist to server
bun run lint             # Biome linting
bun run format           # Biome formatting
bun run type-check       # TypeScript check
bun run test             # Run tests
```

## Architecture

### Monorepo Structure
- `client/` - React frontend (Vite, TanStack Router, TanStack Query, Tailwind)
- `server/` - Hono backend with SQLite/Drizzle
- `shared/` - Shared TypeScript types

### Client-Server Communication
- Server runs on port 4242, serves built React app from `./static`
- Use `hcWithType` from `shared` for type-safe API calls
- Settings API: `GET/POST /api/settings`
- Chat API: `POST /api/chat` (streams AI responses)

### Database
- Single-row `settings` table (upsert pattern) stores all API credentials
- Connection: `server/src/db/index.ts` (Bun's SQLite)
- Schema: `server/src/db/schema.ts`

### AI Agent (Media Agent)
- Entry: `server/src/agents/media_agent.ts`
- Uses LangChain with custom tools:
  - `sonarr_search`, `sonarr_add` - TV show management
  - `radarr_search`, `radarr_add` - Movie management
  - `trakt_trending`, `tmdb_search` - Discovery
- Services in `server/src/services/` handle external API calls (sonarr.ts, radarr.ts, etc.)

### Frontend Routes (TanStack Router)
- `/` - Home
- `/chat` - AI chat interface
- `/onboarding` - Initial settings setup
- `/settings` - Settings management

## Key Files

- `server/src/index.ts` - Server entry, route registration, middleware
- `server/src/routes/chat.ts` - Chat endpoint (handles streaming AI responses)
- `client/src/routes/__root.tsx` - Root layout with navigation
- `client/src/routes/settings.tsx` - Settings page with TanStack Form
- `server/src/services/*.ts` - External API integrations

## Development Notes

- Server must be built before client can use typed API client (`hcWithType`)
- Changes to `shared/` require rebuilding that package
- API credentials are read from database per-request for agent tools
- Client checks for OpenAI API key to redirect to onboarding if missing
