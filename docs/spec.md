# jailu — Specification

A URL shortener: turn a long link into a short `https://jai.lu/<code>` that
redirects to the original. Built to be simple, hardened, and production-ready.

## Scope

**In:** shorten a URL, redirect, persist in SQL, robust validation, polished UI,
passkey auth, per-user link management (custom alias, disable, delete,
optional expiry), click analytics, rate limiting, redis caching, live deploy on
`jai.lu`.

**Out (documented, not built):** teams/roles, bulk import, QR codes,
malicious-URL scanning (Safe Browsing), email flows, cross-shortener
redirect-loop detection (`jai.lu -> other -> jai.lu`).

## Architecture

pnpm monorepo. A React SPA calls a Hono API. The API server is the single source
of truth: it validates request bodies with zod and exposes end-to-end types to the
client via Hono RPC (`hc<AppType>`). In production Caddy is the edge — TLS, static
SPA, security headers — reverse-proxying `/api/*` and `/:code` to Hono, which never
serves static. Postgres is the source of truth for data; Redis caches hot lookups
(sliding TTL, bounded) and backs rate limiting.

```
apps/web         React SPA — vite, @tanstack/react-router, @tanstack/react-query, tailwind, shadcn/ui, react-hook-form, zod
apps/api         Hono (Node) — kysely + pg, better-auth, redis, zod; owns the contract (RPC)
packages/shared  flat value schemas (urlSchema, …) shared by forms + API request schemas
```

- **Shorten:** `POST /api/links` -> zod-validate + normalize -> mint random code -> insert -> return short URL.
- **Redirect:** `GET /:code` -> Redis lookup (fallback Postgres) -> if expired `410`, else `302` to target -> record click async.
- **Contract:** the API owns it. Server validates with `@hono/zod-validator`; the client gets typed calls + response types via Hono RPC. Client forms keep their own schemas and map to the API payload — form data is not the API input (see ADR-0003).

## Data model

- `links` — `id`, `code` (unique), `originalUrl`, `ownerId` (nullable), `disabled`, `expiresAt` (nullable), `createdAt`.
- `clickEvents` — `linkId`, `occurredAt`, `referrer` (analytics slice).
- auth tables (`users`, `sessions`, `passkeys`) — owned and migrated by better-auth.

Naming is camelCase end-to-end — TS types, API JSON, and DB columns. Kysely
quotes identifiers and better-auth defaults to camelCase, so one convention
holds across the stack; only hand-written psql needs quoted identifiers.

## API surface

| Method | Path                   | Auth     | Purpose                                    |
| ------ | ---------------------- | -------- | ------------------------------------------ |
| POST   | `/api/links`           | optional | Shorten (alias requires auth)              |
| GET    | `/api/links`           | required | List my links                              |
| PATCH  | `/api/links/:id`       | required | Disable / set expiry (target is immutable) |
| DELETE | `/api/links/:id`       | required | Delete                                     |
| GET    | `/api/links/:id/stats` | required | Click analytics                            |
| GET    | `/:code`               | public   | Redirect                                   |
| ALL    | `/api/auth/*`          | —        | better-auth (passkeys, session)            |
| GET    | `/api/health`          | —        | Health probe                               |

## Key decisions (see `docs/adr/`)

- `302` redirect, not `301` — keep control over the destination and analytics.
- Random 7-char base64url codes (URL-safe 64-char alphabet) — 64^7 = 4,398,046,511,104 possibilities; non-enumerable; unique constraint + retry on collision.
- Redis cache on the redirect hot path — sliding TTL (resets on access), bounded with LRU eviction (newest evicts oldest); invalidated on disable/expire.
- Redis rate limiting on mint + auth + redirect.
- API contract via Hono RPC — the server owns request/response types; only flat value schemas are shared (`packages/shared`); forms own their schemas (ADR-0003).
- `kysely` (typed SQL) over an ORM — explicit queries, full types, no magic.
- Passkeys (WebAuthn) via better-auth — phishing-resistant, session-only.
- Link expiry is authoritative in Postgres (`expiresAt`); Redis TTL only mirrors it. Expired links return `410`.
- Link destinations are immutable — `PATCH` never repoints an existing code (anti-phishing, ADR-0004).
- Redirect lookup is benchmarked (redis-then-pg vs pg-only) before assuming the cache wins — a unique-indexed `code` hit may beat the round-trip at low cardinality.

## Security posture

- Scheme allowlist (`http`/`https`); reject `javascript:`/`data:`/`file:`; reject self-host (`jai.lu`); length cap; normalize.
- Non-enumerable codes; parameterized queries (kysely); httpOnly session cookies.
- Rate limiting on mint, auth, and redirect endpoints.
- Target URLs are never fetched server-side — no SSRF surface.
- Destinations are immutable after creation (ADR-0004).
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`, `Permissions-Policy`) at Caddy, with Hono `secureHeaders` as defense-in-depth.
- HTTPS terminated by Caddy; secrets via env, never committed.
- Next steps: domain denylist / Safe Browsing, abuse reporting, per-owner quotas, cross-shortener loop detection.

## Roadmap (PR per slice)

0. Foundations — monorepo, tooling, CI, docker-compose (pg+redis), test harness, docs.
1. Core — shorten + redirect, hardened validation, random codes.
2. UI polish — tailwind + shadcn, react-hook-form, all states.
3. Scale + security — redis cache, rate limiting, threat model.
4. Deploy — `jai.lu` (Caddy edge, dockerized) + CI/CD, live from here.
5. Passkey auth — better-auth.
6. Management — dashboard, custom alias, disable/delete, optional expiry (TTL).
7. Analytics — click tracking + per-link chart.

## Quality gates (every slice PR)

Green before merge: oxc lint (deny-warnings) + oxfmt, typecheck, `vitest` unit
(100% of first-party code; generated/vendor excluded), `playwright` e2e,
security review, docs current.

## Deploy

`jai.lu` points at the production host. The app follows the host's conventions —
a single loopback port, Postgres + Redis, a Caddy edge, and a health endpoint —
packaged with Docker. CI runs the gates on every PR; merge to `main` triggers a deploy.
