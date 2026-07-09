# jailu

A URL shortener: turn a long link into a short `https://jai.lu/<code>` that redirects to
the original. Built to be simple, hardened, and production-ready — see [`docs/spec.md`](docs/spec.md)
for the full specification and [`docs/adr/`](docs/adr) for the decisions behind it.

## Stack

pnpm monorepo. A React SPA (`apps/web`) calls a Hono API (`apps/api`) that owns the
contract and exposes end-to-end types via Hono RPC. Postgres is the source of truth
(kysely, typed SQL). Flat value schemas shared by both sides live in `packages/shared`.

## Getting started (local dev)

Prerequisites: Docker. (pnpm + Node 24 only if you want to run the gate on the host.)

```sh
docker compose watch       # Postgres + Redis + API + web, with live-reload on edits
```

That's the whole stack: the API on http://localhost:3000 and the SPA on
http://localhost:5173 (its `/api` calls are proxied to the API). Compose injects each
service's environment and applies pending migrations on start, so there's no `.env` to
copy for the containers.

`watch` is the dev loop: edit a file under `src/` and it's synced into the running
container, so vite's HMR and the API's `tsx watch` reload — and because the sync writes
into the container (not via a bind mount), it works on macOS/Windows too, where bind-mount
file events don't propagate. Changing a `package.json`/lockfile rebuilds that image; a
`vite.config.ts` change restarts web. Use plain `docker compose up` to just run the stack
as built (no watching) — it's what the CI smoke job uses.

Configuration is **fail-loud**: every variable the API needs is validated on boot (see
[`apps/api/src/config.ts`](apps/api/src/config.ts)) — nothing is silently defaulted, so a
missing value is an error, not a surprise. In a container that env comes from compose; on
the host (tests, CI) it comes from the environment — there is no in-process `.env` loader.

Try it once the stack is up:

```sh
curl -X POST localhost:3000/api/links -H 'content-type: application/json' \
  -d '{"url":"https://example.com/some/long/path"}'
# -> { "linkCode": "...", "url": ".../<linkCode>", "originalUrl": "..." }
```

## Quality gates

Every slice ships behind an all-green gate: `pnpm lint` (oxlint, deny-warnings),
`pnpm fmt:check` (oxfmt), `pnpm typecheck`, `pnpm coverage` (vitest, 100% of first-party
logic incl. real-Postgres integration), and `pnpm test:e2e` (Playwright). CI runs them on
every PR.

To run the gate on the host, provide the API's env first — either export a copied
`.env` (`cp .env.example .env`, then `set -a; . ./.env; set +a`) or run it inside the
stack: `docker compose run --rm api pnpm coverage`.

## Layout

```
apps/api         Hono API + redirect — kysely/pg, owns the contract (RPC)
apps/web         React SPA — vite, @tanstack/*, tailwind, shadcn/ui
packages/shared  flat value schemas (urlSchema, hostSchema, …) shared by both
docs/            spec + architecture decision records
```
