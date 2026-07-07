# ADR-0001 — pnpm monorepo

Status: accepted

Decision: One pnpm monorepo — `apps/web`, `apps/api`, and `packages/shared` for flat
single-value schemas (`urlSchema`, `emailSchema`, …) reused by client forms and
API request schemas. Object and request/response contracts are not shared (see ADR-0003).

Why: two deployables, one toolchain / lockfile / CI; only atomic, semantically-identical
schemas cross the boundary — nothing an app owns leaks.

Rejected: two repos (double tooling, drift); a shared _object_ contract (redundant with RPC).
