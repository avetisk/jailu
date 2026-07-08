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

Within an **application** package (`apps/*`), use the `@/` tsconfig path alias for
intra-package imports — never deep relative chains (`../../..`). Each app is its own
`tsc`/`tsx`/`vite` entry point, so `@/*` (→ `./src/*`) resolves everywhere in it.

The `packages/shared` library is consumed **as source** by the apps, so its own internal
imports stay **relative** (`./x`): `@/` inside shared resolves against the _consumer's_
tsconfig, not shared's, which breaks `tsc` typecheck and `tsx` runtime in the apps
(verified). Shared's imports are all same-directory, so relative stays flat and clean.
Cross-package imports always use the package name (`@jailu/shared`).
