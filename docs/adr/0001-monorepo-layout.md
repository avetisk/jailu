# ADR-0001 — pnpm monorepo, apps only

Status: accepted

Decision: One pnpm monorepo with `apps/web` and `apps/api`. No shared "contract" package;
the `packages/*` slot is reserved for genuinely neutral utilities if any ever emerge.

Why: two deployables, one toolchain / lockfile / CI; apps stay independent — no app depends
on another at runtime.

Rejected: two repos (double tooling, cross-repo version drift); a shared contract package
(see ADR-0003).
