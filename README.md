# jailu

A URL shortener: turn a long link into a short `https://jai.lu/<code>` that redirects to
the original. Built to be simple, hardened, and production-ready — see [`docs/spec.md`](docs/spec.md)
for the full specification and [`docs/adr/`](docs/adr) for the decisions behind it.

## Workflow

Spec-driven, one thin vertical slice per PR, every slice behind an all-green gate.
The agent implements inside human-authored rails — the spec, the ADRs, and
`CLAUDE.md`; I set the intent, review each diff, and hold the gate. Nothing merges
that isn't green.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RAILS · human-authored, durable, in version control
   docs/spec.md   scope · architecture · data model · API · roadmap · gates
   docs/adr/NN    one decision per file, cross-referenced
   CLAUDE.md      conventions + guardrails — "read the docs first"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              │ steers every slice
                              ▼
        roadmap ─►  thin vertical SLICES, one PR each
                    ( 1 · 2a · 2b · 2c · 2d · 3a · … )
                              │
                              ▼
   ┌───────────────────────  PER SLICE  ───────────────────────────┐
   │                                                               │
   │   branch  slice/<phase><letter>                               │
   │       │                                                       │
   │       ▼                                                       │
   │   AGENT implements ──────────────┐                            │
   │       │                          │  review loop:              │
   │       ▼                          │  "address review           │
   │   HUMAN review ── changes ───────┘   → refactor"              │
   │       │ approved                                              │
   │       ▼                                                       │
   │   QUALITY GATE — all-green before merge                       │
   │       lint(deny-warn) · fmt · typecheck ·                     │
   │       coverage(real-pg) · e2e · security review · docs        │
   │       │                                                       │
   │       ▼                                                       │
   │   PR ─► CI (same gate) ─► merge → main ──► next slice ↺       │
   │       │                                                       │
   └───────┼───────────────────────────────────────────────────────┘
           │ deploy on merge
           ▼
      jai.lu  (live)
```

## Stack

pnpm monorepo. A React SPA (`apps/web`) calls a Hono API (`apps/api`) that owns the
contract and exposes end-to-end types via Hono RPC. Postgres is the source of truth
(kysely, typed SQL). Flat value schemas shared by both sides live in `packages/shared`.

## Getting started

The whole stack — Postgres, Redis, the API, and the web app — runs from a single command
with Docker. Nothing else is installed on your machine: no local Node, pnpm, database, or
`.env` to copy. Every dependency resolves from the public npm registry.

### Prerequisites

- **Docker Engine** with the **Compose v2** plugin (the `docker compose` subcommand). The
  live-reload dev loop (`docker compose watch`, below) needs Compose ≥ 2.22.

That's all you need to run the app. Node 24 (see `.nvmrc`) and pnpm are only required to run
the quality gate on the host — see [Quality gates](#quality-gates).

### Run it

```sh
git clone https://github.com/avetisk/jailu.git
cd jailu
docker compose up --wait -d
```

`docker compose up` builds the two app images (installing the pnpm workspace against a
frozen lockfile), then starts Postgres 17, Redis 7, the API, and the web app. `--wait`
blocks until every container passes its healthcheck; `-d` runs them in the background. The
API applies pending database migrations on start, so the schema is ready with no extra
step. The first run builds the images and can take a few minutes; later runs reuse the
build cache and come up in well under a minute.

When the command returns, the stack is up:

- **Web app** — http://localhost:5173
- **API** — http://localhost:3000 (health check: http://localhost:3000/api/health)

### Try it

Open **http://localhost:5173**, paste a long URL, and submit — you get a short
`http://localhost:5173/<code>` to copy; visiting it redirects to the original.

Or from the shell:

```sh
# shorten a URL
curl -X POST localhost:3000/api/links -H 'content-type: application/json' \
  -d '{"url":"https://example.com/some/long/path"}'
# -> {"linkCode":"XEzs1DX","url":"http://localhost:5173/XEzs1DX","originalUrl":"https://example.com/some/long/path"}

# follow the short link (302 -> the original URL)
curl -I localhost:5173/XEzs1DX
```

### Develop

Use `docker compose watch` instead of `up` for the dev loop: edits under `src/` are synced
into the running containers, so Vite's HMR and the API's `tsx watch` reload. Because the
sync writes into the container rather than relying on a bind mount, it works on
macOS/Windows too, where bind-mount file events don't propagate. Changing a
`package.json`/lockfile rebuilds that image; a `vite.config.ts` change restarts web.

Configuration is **fail-loud**: every variable the API needs is validated on boot (see
[`apps/api/src/config.ts`](apps/api/src/config.ts)) — nothing is silently defaulted, so a
missing value is an error, not a surprise. In a container that env is injected by Compose;
on the host (tests, CI) it comes from the environment — there is no in-process `.env` loader.

### Stop / reset

```sh
docker compose down       # stop and remove the containers
docker compose down -v    # …and drop the Postgres volume for a clean slate
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
