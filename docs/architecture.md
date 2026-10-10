# Architecture

This document describes how the repository is organised and the rules that keep it maintainable.
Update it when a convention changes.

## Repository layout

```
.
├── apps/
│   ├── web/                    React + Vite + Tailwind client (npm)
│   │   ├── src/
│   │   │   ├── app/            App root: App.tsx, routing, app-wide providers
│   │   │   ├── components/
│   │   │   │   ├── ui/         Generic, presentational building blocks (Button, Card, …)
│   │   │   │   └── layout/     Page chrome (header, nav, page shell)
│   │   │   ├── features/       One folder per product feature (see below)
│   │   │   │   ├── typing-test/
│   │   │   │   ├── race/
│   │   │   │   ├── auth/
│   │   │   │   ├── leaderboard/
│   │   │   │   └── profile/
│   │   │   ├── lib/            Cross-feature infrastructure: HTTP client, WebSocket client
│   │   │   ├── index.css       Tailwind entry
│   │   │   └── main.tsx        Browser entry point
│   │   ├── tests/unit/         Vitest unit tests
│   │   ├── index.html
│   │   └── vite.config.ts      Vite + Vitest config, aliases, dev proxy
│   └── api/                    Bun + Hono server (Bun)
│       ├── src/
│       │   ├── index.ts        Process entry: Bun.serve (HTTP + WebSocket)
│       │   ├── app.ts          Hono app: global middleware + module routers
│       │   ├── config/         Zod-validated environment (env.ts)
│       │   ├── database/       Kysely instance, table types, migrations, seeds
│       │   ├── modules/        One folder per domain module (see below)
│       │   ├── middleware/     Cross-cutting Hono middleware (auth guard, error handler)
│       │   └── websocket/      WebSocket transport: upgrade, message parsing, dispatch
│       ├── tests/
│       │   ├── unit/           Pure logic (services, race engine) with dependencies faked
│       │   └── integration/    HTTP via app.request(), repositories against a test DB
│       ├── kysely.config.ts    kysely-ctl CLI config (migrations, seeds)
│       └── vitest.config.ts
├── packages/
│   └── shared/                 @trr/shared: code used by BOTH apps
│       └── src/
│           ├── constants/      Game rules (race duration, player limits, …)
│           ├── schemas/        Zod schemas for API payloads and WebSocket messages
│           └── index.ts        The only public entry point
├── e2e/                        Playwright end-to-end tests (drive web + api together)
├── docs/                       Project documentation
├── playwright.config.ts
├── tsconfig.base.json          Compiler options shared by every project
├── tsconfig.json               Type-checks root files (e2e, Playwright config)
└── .env.example                Template for the single root .env
```

Folders that contain only `.gitkeep` are intentional placeholders for planned code; delete the
`.gitkeep` when the first real file lands.

## Package managers

| Project           | Manager | Why                                                        |
| ----------------- | ------- | ---------------------------------------------------------- |
| root, api, shared | Bun     | Bun workspace (`workspaces` in root `package.json`)        |
| apps/web          | npm     | Standalone npm project with its own `package-lock.json`    |

`apps/web` is deliberately **not** a Bun workspace member. It consumes `@trr/shared` via a
TypeScript path + Vite alias pointing at `packages/shared/src`, and Vite's `resolve.dedupe`
ensures shared code uses the web app's own copy of `zod`.

## Feature / module organisation

### Web (`apps/web/src/features/<feature>/`)

Each feature owns its components, hooks, API calls and local types. A typical feature grows into:

```
features/race/
├── components/       RaceTrack.tsx, Lobby.tsx, …
├── hooks/            useRaceSocket.ts, …
├── api.ts            HTTP calls for this feature (uses lib/ HTTP client)
└── index.ts          Public surface used by app/ (pages, routes)
```

Rules:
- Features do not import from each other's internals. If two features need the same thing,
  move it to `components/ui`, `lib/`, or `@trr/shared`.
- Global `hooks/`, `utils/`, `types/` folders are intentionally absent. Code starts inside a
  feature and is promoted only when a second consumer appears.

### API (`apps/api/src/modules/<module>/`)

| Module        | Responsibility                                                     |
| ------------- | ------------------------------------------------------------------ |
| `auth`        | Register, login, logout, session handling                          |
| `users`       | Profile read/update                                                |
| `passages`    | Texts to type, served for both solo tests and races                |
| `races`       | Room lifecycle (create/join by code), race state machine, finishing order |
| `results`     | Persisting solo/race results, personal race history                |
| `leaderboard` | Aggregated rankings                                                |

Each module uses the same layering, one file per layer:

```
modules/races/
├── races.routes.ts       Hono router: parse/validate input (Zod), call service, shape response
├── races.service.ts      Business logic. No HTTP, no SQL, no WebSocket objects
├── races.repository.ts   All Kysely queries for this module
└── races.schemas.ts      Server-only Zod schemas (public ones live in @trr/shared)
```

## Dependency rules

```
web ──► @trr/shared ◄── api                  (shared imports nothing from the apps)

routes ──► service ──► repository ──► database/db
websocket/ ──► modules/races (service)        (race logic never imports websocket/)
```

- Only repositories import `db`.
- Services receive plain data and return plain data; they are unit-testable without a DB or server.
- `websocket/` owns sockets: it authenticates the upgrade, validates incoming messages with shared
  Zod schemas, calls the races service, and broadcasts the events it returns. The race engine
  itself is transport-agnostic.
- Modules may call another module's **service**, never its repository.

## Configuration

- One `.env` at the repository root (copied from `.env.example`, never committed).
- API: loaded with `bun --env-file=../../.env`, validated once in `apps/api/src/config/env.ts`.
  Code reads `env`, never `process.env`.
- Web: Vite reads the same file via `envDir`; only `VITE_`-prefixed variables reach the browser.
- In development, Vite proxies `/api` and `/ws` to the API (`API_PORT`), so the browser talks to a
  single origin: no CORS configuration, and HTTP-only cookies work out of the box.

## Database

- PostgreSQL via Kysely with the official `PostgresDialect` (`pg` driver), which runs under both
  Bun and Node (Vitest).
- Migrations and seeds are managed with `kysely-ctl` (`bun run db:make <name>`,
  `db:migrate`, `db:rollback`, `db:seed`). Its config reuses `database/db.ts`.
- `database/types.ts` holds the `Database` interface; update it alongside each migration.

## Testing

| Level       | Location                                   | Tool       |
| ----------- | ------------------------------------------ | ---------- |
| Unit        | `apps/*/tests/unit`                        | Vitest     |
| Integration | `apps/api/tests/integration`               | Vitest     |
| End-to-end  | `e2e/` (root, since it spans both apps)    | Playwright |

Notes:
- Vitest runs on Node, not Bun. Keep Bun-only APIs (`Bun.serve`, `Bun.password`, …) at the edges
  (`index.ts`, thin adapters) so services and routes stay testable.
- API integration tests call `app.request()`; they do not need a running server.
- Web component tests (Testing Library + jsdom) will go in `apps/web/tests/integration/` when the
  first interactive feature is built.
