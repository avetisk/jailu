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

## Technical choices

The decisions and their rationale live in [`docs/spec.md`](docs/spec.md) and one ADR per
decision under [`docs/adr/`](docs/adr). The headlines, each linking to the detail:

- **Monorepo, shared as source** — a pnpm workspace; the SPA and API consume
  `packages/shared` (and the API's RPC types) as TypeScript source, with no build step
  between packages. [ADR-0001](docs/adr/0001-monorepo-layout.md)
- **The API owns the contract via Hono RPC** — the server defines request/response types
  and the client gets them end-to-end typed (`hc<AppType>`); only flat value schemas are
  shared, and forms keep their own schemas mapping to the API payload.
  [ADR-0003](docs/adr/0003-api-contract-via-rpc.md), [ADR-0007](docs/adr/0007-validation-error-codes.md)
- **Typed SQL over an ORM** — `kysely` + `pg`, explicit queries and full types; Postgres is
  the source of truth. ([Architecture](docs/spec.md#architecture))
- **Hardened URL validation** — the shared `urlSchema` allowlists `http`/`https`, rejects
  embedded credentials / self-host / `localhost` / bare IPs / no-public-TLD, caps length,
  and normalizes; the target is never fetched server-side (no SSRF).
  [ADR-0005](docs/adr/0005-url-validation-hardening.md)
- **Non-enumerable codes, `302` redirect** — random 7-char base64url (64^7 ≈ 4.4×10¹²),
  unique constraint + retry on collision; `302` (not `301`) keeps control of the
  destination and enables analytics. ([Key decisions](docs/spec.md#key-decisions-see-docsadr))
- **Immutable destinations** — a code never repoints after creation (anti-phishing).
  [ADR-0004](docs/adr/0004-immutable-destination.md)
- **Short links from a configured base URL** — built from `PUBLIC_BASE_URL`, never the
  request `Host`, so links can't be poisoned by a spoofed Host header.
  [ADR-0009](docs/adr/0009-public-base-url.md)
- **Redis cache on the redirect hot path** — cache-aside, sliding TTL, bounded + LRU, and
  benchmarked against pg-only before adopting. [ADR-0010](docs/adr/0010-redirect-cache.md)
- **Single origin behind a Caddy edge** — in prod Caddy terminates TLS, serves the SPA,
  sets security headers, and proxies `/api/*` + `/:code`; Hono never serves static.
  [ADR-0002](docs/adr/0002-single-origin-deployment.md)
- **Dockerized dev stack** — one `docker compose` brings up pg + redis + api + web with env
  injected by Compose; config is fail-loud with no in-process `.env` loader.
  [ADR-0006](docs/adr/0006-dockerized-dev-stack.md)
- **UI** — React + Vite, `@tanstack/react-router` / `-query` / `-form`, tailwind +
  shadcn/ui, react-i18next; the form validates the shared zod schema via TanStack Form.
  [ADR-0008](docs/adr/0008-forms-tanstack.md)

Full security posture: [`docs/spec.md` → Security posture](docs/spec.md#security-posture).

## Assumptions & shortcuts

The brief — a simple URL shortener: a React + TypeScript form, a shorten endpoint, working
redirection, and a SQL database, easy to run — is delivered and runs from one command
([above](#getting-started)). Live on `main`: shorten (`POST /api/links`), redirect
(`GET /:code`), a health probe, hardened validation, non-enumerable codes, the polished UI
(i18n + form), and a Redis cache on the redirect path.

**Assumptions baked in:**

- Destinations are **immutable** — a code never repoints after creation ([ADR-0004](docs/adr/0004-immutable-destination.md)).
- Short links are built from a configured `PUBLIC_BASE_URL`, never the request `Host` ([ADR-0009](docs/adr/0009-public-base-url.md)).
- Config is **fail-loud** — every variable is validated on boot, with no silent defaults and
  no in-process `.env` loader; env comes from Compose (containers) or the environment (host,
  for tests/CI). ([ADR-0006](docs/adr/0006-dockerized-dev-stack.md))

**Deliberate shortcuts:**

- **No cache invalidation** — safe by construction: destinations are immutable and there is
  no disable/expiry, so a cached entry can't go stale ([ADR-0010](docs/adr/0010-redirect-cache.md)).
- **No Caddy in dev** — the Vite dev server stands in for the production edge (it proxies
  `/api/*` and code-shaped paths to the API); TLS, security headers, and static serving are
  the prod-only Caddy layer ([ADR-0002](docs/adr/0002-single-origin-deployment.md)).

**Beyond the brief — future work, by design:** the [spec](docs/spec.md) sketches a fuller
product, built as further [slices](docs/spec.md#roadmap-pr-per-slice) — passkey auth,
per-user link management (alias / disable / delete / expiry), click analytics, rate
limiting, and a live Caddy deploy. These are intentionally outside this test's scope, not
unfinished work. Explicitly excluded even from that roadmap ([Scope](docs/spec.md#scope)):
teams/roles, bulk import, QR codes, malicious-URL scanning, email flows, cross-shortener
redirect-loop detection.

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
