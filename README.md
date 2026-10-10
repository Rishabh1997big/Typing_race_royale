# Typing Race Royale

A competitive typing-race web app: solo 60-second typing tests with live WPM/accuracy, and
private real-time multiplayer races (2–8 players) joined by room code, with results, race
history, profiles and a leaderboard.

## Tech stack

| Area     | Tools                                                    |
| -------- | -------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS (npm)              |
| Backend  | Bun, Hono, TypeScript, WebSockets                        |
| Database | PostgreSQL, Kysely, kysely-ctl migrations                |
| Shared   | Zod schemas, types and constants (`packages/shared`)     |
| Testing  | Vitest (unit/integration), Playwright (end-to-end)       |

## Prerequisites

- [Bun](https://bun.sh) 1.4+
- Node.js 22+ and npm
- PostgreSQL 16+

## Getting started

```bash
# 1. Install dependencies (Bun for root/api/shared, npm for the web app)
bun run setup

# 2. Configure environment
cp .env.example .env        # then edit DATABASE_URL

# 3. Run database migrations
bun run db:migrate

# 4. Start the apps (two terminals)
bun run dev:api             # http://localhost:3000
bun run dev:web             # http://localhost:5173 (proxies /api and /ws to the API)
```

## Scripts (from the repository root)

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `bun run setup`     | Install all dependencies                      |
| `bun run dev:api`   | Start the API in watch mode                   |
| `bun run dev:web`   | Start the Vite dev server                     |
| `bun run db:migrate`| Apply pending database migrations             |
| `bun run typecheck` | Type-check every project                      |
| `bun run test`      | Run API and web Vitest suites                 |
| `bun run test:e2e`  | Run Playwright end-to-end tests               |

App-specific scripts (e.g. `db:make`, `db:rollback`, `db:seed`, `test:unit`) live in each app's
`package.json`. Before the first e2e run, install browsers with `bunx playwright install chromium`.

## Project structure

```
apps/web         React client
apps/api         Bun + Hono API and WebSocket server
packages/shared  Types, Zod schemas and constants shared by both apps
e2e              Playwright tests
docs             Project documentation
```

See [docs/architecture.md](docs/architecture.md) for folder responsibilities, layering rules,
configuration and testing conventions.
