# beavarr 🦫

![logo](client/src/assets/logo.png)

A full-stack TypeScript monorepo application that leverages LLMs along with Trakt, Sonarr, and Radarr to give users comprehensive advice on their show/movie watch experience.

## What's beavarr?

Beavarr combines the "Beaver" from the BHVR tech stack with the "\*arr" stack (Sonarr/Radarr) ecosystem. It aims to modernize media management by integrating intelligent agents to guide your viewing habits.

While built on the solid foundation of the BHVR stack, beavarr extends it to create a personalized media assistant.

## Features

- **LLM Integration**: AI-powered recommendations and insights for your library.
    - OpenAI API compatible
- **Media Stack Integration**: Seamlessly works with Trakt, Sonarr, and Radarr.

    | service       | Watch history | Library | Metadata |
    | ------------- | :-----------: | :-----: | :------: |
    | Sonarr        |               |   ✅    |    ✅    |
    | Radarr        |               |   ✅    |    ✅    |
    | Jellyfin(WIP) |      ✅       |   ✅    |    ✅    |
    | Trakt         |      ✅       |         |          |
    | TMDB(Planed)  |               |         |    ✅    |
    | TVDB(Planed)  |               |         |    ✅    |
    | IMDB(Planed)  |               |         |    ✅    |

### TODO

- explore the franchise/timeline
- explore what's the references in the show/movie, like poster in the scene, etc
- **[performance]** cache Sonarr/Radarr library data in local SQLite (via Drizzle) and sync
  periodically or on-demand, so `sonarr_list`/`radarr_list` agent tools can query locally
  with real pagination instead of fetching the entire library into memory on every LLM call.
  Neither the Sonarr `GET /api/v3/series` nor the Radarr `GET /api/v3/movie` endpoint supports
  server-side pagination, making a local cache the only way to avoid full in-memory loads.

## Tech statck

- [TypeScript 7](https://www.typescriptlang.org/docs/) full-stack
- [Bun](https://bun.sh) as the JavaScript runtime and package manager
- [Hono](https://hono.dev) as the backend framework
- [Vite](https://vitejs.dev) for frontend bundling
- [React](https://react.dev) for the frontend UI
- [Oxc](https://oxc.rs) (Oxlint & Oxfmt) for high-performance linting and formatting
- [Turbo](https://turbo.build) for monorepo build orchestration and caching

### Project Structure

```
.
├── client/               # React frontend
├── server/               # Hono backend
├── shared/               # Shared TypeScript definitions
│   └── src/types/        # Type definitions used by both client and server
├── .oxlintrc.json        # Oxc linter configuration
├── .oxfmtrc.json         # Oxc formatter configuration
├── package.json          # Root package.json with workspaces
└── turbo.json            # Turbo configuration for build orchestration
```

#### Server

bhvr uses Hono as a backend API for its simplicity and massive ecosystem of plugins. If you have ever used Express then it might feel familiar. Declaring routes and returning data is easy.

```
server
├── bun.lock
├── package.json
├── README.md
├── src
│   └── index.ts
└── tsconfig.json
```

```typescript src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ApiResponse } from 'shared/dist';

const app = new Hono();

app.use(cors());

app.get('/', (c) => {
    return c.text('Hello Hono!');
});

app.get('/hello', async (c) => {
    const data: ApiResponse = {
        message: 'Hello BHVR!',
        success: true,
    };

    return c.json(data, { status: 200 });
});

export default app;
```

If you wanted to add a database to Hono you can do so with a multitude of Typescript libraries like [Supabase](https://supabase.com), or ORMs like [Drizzle](https://orm.drizzle.team/docs/get-started) or [Prisma](https://www.prisma.io/orm)

#### Client

bhvr uses Vite + React Typescript template, which means you can build your frontend just as you would with any other React app. This makes it flexible to add UI components like [shadcn/ui](https://ui.shadcn.com) or routing using [React Router](https://reactrouter.com/start/declarative/installation).

```
client
├── index.html
├── package.json
├── public
│   └── vite.svg
├── README.md
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

```typescript src/App.tsx
import { useState } from 'react'
import beaver from './assets/beaver.svg'
import { ApiResponse } from 'shared'
import './App.css'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4242"

function App() {
  const [data, setData] = useState<ApiResponse | undefined>()

  async function sendRequest() {
    try {
      const req = await fetch(`${SERVER_URL}/hello`)
      const res: ApiResponse = await req.json()
      setData(res)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <div>
        <a href="https://github.com/stevedylandev/bhvr" target="_blank">
          <img src={beaver} className="logo" alt="beaver logo" />
        </a>
      </div>
      <h1>bhvr</h1>
      <h2>Bun + Hono + Vite + React</h2>
      <p>A typesafe fullstack monorepo</p>
      <div className="card">
        <button onClick={sendRequest}>
          Call API
        </button>
        {data && (
          <pre className='response'>
            <code>
            Message: {data.message} <br />
            Success: {data.success.toString()}
            </code>
          </pre>
        )}
      </div>
      <p className="read-the-docs">
        Click the beaver to learn more
      </p>
    </>
  )
}

export default App
```

#### Shared

The Shared package is used for anything you want to share between the Server and Client. This could be types or libraries that you use in both environments.

```
shared
├── package.json
├── src
│   ├── index.ts
│   └── types
│       └── index.ts
└── tsconfig.json
```

Inside the `src/index.ts` we export any of our code from the folders so it's usable in other parts of the monorepo

```typescript
export * from './types';
```

By running `bun run dev` or `bun run build` it will compile and export the packages from `shared` so it can be used in either `client` or `server`

```typescript
import { ApiResponse } from 'shared';
```

### Configuration

Environment variables are split by package because each has a different runtime:

| Package   | Env file      | Loaded by                                            |
| --------- | ------------- | ---------------------------------------------------- |
| `server/` | `server/.env` | Bun (from the server's CWD)                          |
| `client/` | `client/.env` | Vite (only `VITE_*` vars are exposed to the browser) |

#### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and adjust as needed:

```bash
cp server/.env.example server/.env
```

| Variable                    | Default | Description                                     |
| --------------------------- | ------- | ----------------------------------------------- |
| `PORT`                      | `4242`  | Port the Hono server listens on                 |
| `ARR_CONNECTION_TIMEOUT_MS` | `5000`  | Timeout (ms) for Radarr/Sonarr connection tests |

#### Client (`client/.env`)

```bash
# client/.env
VITE_SERVER_URL=http://localhost:4242   # URL of the Hono backend (dev only)
```

### Getting Started

#### Quick Start

You can start a new bhvr project using the [CLI](https://github.com/stevedylandev/create-bhvr)

```bash
bun create bhvr
```

#### Installation

```bash
# Install dependencies for all workspaces
bun install
```

#### Development

```bash
# Run all workspaces in development mode with Turbo
bun run dev

# Or run individual workspaces directly
bun run dev:client    # Run the Vite dev server for React
bun run dev:server    # Run the Hono backend
```

#### Building

```bash
# Build all workspaces with Turbo
bun run build

# Or build individual workspaces directly
bun run build:client  # Build the React frontend
bun run build:server  # Build the Hono backend
```

#### Additional Commands

```bash
# Lint all workspaces
bun run lint

# Format all workspaces
bun run format

# Type check all workspaces
bun run type-check

# Run tests across all workspaces
bun run test
```

## Credits

- [BHVR](https://github.com/stevedylandev/bhvr)
- [Langchain](https://langchain.com)
- [Recommendarr](https://github.com/TannerMidd/recommendarr)
- [Reiverr](https://github.com/aleksilassila/reiverr)
