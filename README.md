# jailu

A URL shortener: turn a long link into a short `https://jai.lu/<code>` that redirects to
the original. Built to be simple, hardened, and production-ready — see [`docs/spec.md`](docs/spec.md)
for the full specification and [`docs/adr/`](docs/adr) for the decisions behind it.

## Stack

pnpm monorepo. A React SPA (`apps/web`) calls a Hono API (`apps/api`) that owns the
contract and exposes end-to-end types via Hono RPC. Postgres is the source of truth
(kysely, typed SQL). Flat value schemas shared by both sides live in `packages/shared`.

## Getting started (local dev)

Prerequisites: Node 24+, pnpm, Docker.

```sh
pnpm install
cp .env.example .env                 # suggested local values; edit as needed
docker compose up -d                 # Postgres + Redis
pnpm --filter @jailu/api migrate     # create the schema
pnpm dev                             # api + web dev servers
```

Configuration is **fail-loud**: every variable in `.env.example` is required and
validated on boot — nothing is silently defaulted, so a missing value is an error, not a
surprise. Copy the file and the app starts; forget to, and it tells you exactly what's
missing.

Try it once the API is up:

```sh
curl -X POST localhost:3000/api/links -H 'content-type: application/json' \
  -d '{"url":"https://example.com/some/long/path"}'
# -> { "code": "...", "url": ".../<code>", "originalUrl": "..." }
```

## Quality gates

Every slice ships behind an all-green gate: `pnpm lint` (oxlint, deny-warnings),
`pnpm fmt:check` (oxfmt), `pnpm typecheck`, `pnpm coverage` (vitest, 100% of first-party
logic incl. real-Postgres integration), and `pnpm test:e2e` (Playwright). CI runs them on
every PR.

## Layout

```
apps/api         Hono API + redirect — kysely/pg, owns the contract (RPC)
apps/web         React SPA — vite, @tanstack/*, tailwind, shadcn/ui
packages/shared  flat value schemas (urlSchema, hostSchema, …) shared by both
docs/            spec + architecture decision records
```
