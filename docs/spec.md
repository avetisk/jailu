# jailu — Specification

A URL shortener: turn a long link into a short `https://jai.lu/<code>` that
redirects to the original. Built to be simple, hardened, and production-ready.

## Scope

**In:** shorten a URL, redirect, persist in SQL, robust validation, polished UI,
passkey auth, per-user link management (custom alias, edit, disable, delete,
optional expiry), click analytics, rate limiting, redis caching, live deploy on
`jai.lu`.

**Out (documented, not built):** teams/roles, bulk import, QR codes,
malicious-URL scanning (Safe Browsing), email flows.

## Architecture

pnpm monorepo. A React SPA calls a Hono API. The API server is the single source
of truth: it validates request bodies with zod and exposes end-to-end types to the
client via Hono RPC (`hc<AppType>`). Postgres is the source of truth for data; Redis
caches hot lookups and backs rate limiting.

```
apps/web   React SPA — vite, react-router, tailwind, shadcn/ui, react-hook-form, zod
apps/api   Hono (Node) — kysely + pg, better-auth, redis, zod; owns the contract (RPC)
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

| Method | Path                   | Auth     | Purpose                         |
| ------ | ---------------------- | -------- | ------------------------------- |
| POST   | `/api/links`           | optional | Shorten (alias requires auth)   |
| GET    | `/api/links`           | required | List my links                   |
| PATCH  | `/api/links/:id`       | required | Edit target / disable           |
| DELETE | `/api/links/:id`       | required | Delete                          |
| GET    | `/api/links/:id/stats` | required | Click analytics                 |
| GET    | `/:code`               | public   | Redirect                        |
| ALL    | `/api/auth/*`          | —        | better-auth (passkeys, session) |
| GET    | `/api/health`          | —        | Health probe                    |

## Key decisions (see `docs/adr/`)

- `302` redirect, not `301` — keep control over the destination and analytics.
- Random 7-char base62 codes — non-enumerable; unique constraint + retry on collision.
- Redis cache on the redirect hot path; invalidated on edit/disable/delete.
- Redis rate limiting on mint + auth + redirect.
- API contract via Hono RPC — the server owns request/response types; no shared contract package; forms own their schemas (ADR-0003).
- `kysely` (typed SQL) over an ORM — explicit queries, full types, no magic.
- Passkeys (WebAuthn) via better-auth — phishing-resistant, session-only.
- Link expiry is authoritative in Postgres (`expiresAt`); Redis TTL only mirrors it. Expired links return `410`.

## Security posture

- Scheme allowlist (`http`/`https`); reject `javascript:`/`data:`/`file:`; length cap; normalize.
- Non-enumerable codes; parameterized queries (kysely); httpOnly session cookies.
- Rate limiting on mint, auth, and redirect endpoints.
- Target URLs are never fetched server-side — no SSRF surface.
- HTTPS terminated by Caddy; secrets via env, never committed.
- Next steps: domain denylist / Safe Browsing, abuse reporting, per-owner quotas.

## Roadmap (PR per slice)

0. Foundations — monorepo, tooling, CI, docker-compose (pg+redis), test harness, docs.
1. Core — shorten + redirect, hardened validation, random codes.
2. UI polish — tailwind + shadcn, react-hook-form, all states.
3. Scale + security — redis cache, rate limiting, threat model.
4. Deploy — `jai.lu` via railgun + CI/CD (live from here, continuously).
5. Passkey auth — better-auth.
6. Management — dashboard, custom alias, edit/disable/delete, optional expiry (TTL).
7. Analytics — click tracking + per-link chart.

## Quality gates (every slice PR)

Green before merge: oxc lint (deny-warnings) + oxfmt, typecheck, `vitest` unit
(100% of first-party code; generated/vendor excluded), `playwright` e2e,
security review, docs current.

## Deploy

`jai.lu` already points at the railgun production host. railgun conventions
(loopback port, Postgres/Redis, Caddy, health endpoint) are read at slice 4.
CI runs the gates on every PR; merge to `main` triggers a railgun deploy.
