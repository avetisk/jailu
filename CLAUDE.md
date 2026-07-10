# jailu

## Deploy / platform

This project targets a **single-origin deployment behind a Caddy edge**: one
public origin serves the static SPA, proxies `/api/*` to the API, and routes
`/:code` redirects. Before adding a Dockerfile, ports, backing services, or
storage, keep to that shape — a single loopback port, Postgres + Redis, a Caddy
edge, and a health endpoint, packaged with Docker. The canonical deploy contract
lives in the tracked docs; read them before building anything deployable, and
link rather than copy their content here:

- single-origin + Caddy edge rationale: `docs/adr/0002-single-origin-deployment.md`
- deploy topology + platform surface: `docs/spec.md` (`## Deploy`)
- dockerized dev stack: `docs/adr/0006-dockerized-dev-stack.md`

## Imports / path aliases

Use **package-namespaced** path aliases for intra-package imports — `@jailu/<pkg>/src/*`,
defined once in the root `tsconfig.base.json` and inherited by every package (packages do
not redefine `paths`). Never deep relative chains (`../../..`).

Why namespaced and not a bare `@/`: the packages are consumed **as source** — the apps read
`@jailu/shared`'s files for value schemas, and (from Slice 2) web reads `@jailu/api`'s files
for the RPC `AppType`. A bare `@/` resolves against the _consumer's_ tsconfig, so a
dependency's internal `@/` imports break the consumer's `tsc` and `tsx` (verified).
`@jailu/<pkg>/src/*` is globally unambiguous, so it resolves identically from any package —
validated across `tsc`, `tsx`, `vitest`, and `vite`.

- intra-package: `import { db } from "@jailu/api/src/db"`
- cross-package public API: the bare package name — `import { shortenableUrlSchema } from "@jailu/shared"`
- exception: `vite.config.ts` / `playwright.config.ts` bootstrap the alias resolver, so they
  use relative `./src/config` (the alias isn't active yet while the config file itself loads).

## Code layout

One splitting predicate: **domain logic groups by feature; only shared infrastructure
primitives group by technology.** In `apps/api/src/`, `links/` owns the whole links feature
(repository, resolver, cache accessor, code minting); `db/` and `redis/` hold only the infra
clients; `lib/` only domain-agnostic utilities. Don't mix the two axes — a role like "cache" must
live in exactly one place (the feature's `links/cache.ts`), never also as a `cache/` infra folder.
