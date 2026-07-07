# ADR-0001 — Monorepo with a shared contract package

Status: accepted

Decision: One pnpm monorepo (`apps/web`, `apps/api`, `packages/shared`) with request/response
schemas living once in `packages/shared`, consumed as source by both sides.

Why: single source of truth for the API contract — no client/server drift.

Rejected: two repos / duplicated types (both drift).
