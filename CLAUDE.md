# jailu

## Deploy / platform

This project deploys to the shared prod host via **railgun**. Before adding a
Dockerfile, ports, backing services, or storage, follow railgun's platform
conventions (loopback port, container shape, Postgres/S3/Caddy, health
endpoint): `/home/ubuntu/code/avetisk/railgun/docs/platform-conventions.md`
(GitHub: `github.com/avetisk/railgun/blob/main/docs/platform-conventions.md`).
The default tech stack (Solid front; Node+pnpm+Hono for plain apps, Rust/axum
for perf/security-critical) is `docs/default-stack.md` in the same repo.
Those docs are canonical and railgun-owned — read them before building
anything deployable, and link rather than copy their content here.

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
