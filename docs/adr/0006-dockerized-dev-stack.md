# ADR-0006 — Dockerized dev stack, env injected by compose

Status: accepted

Decision: The dev environment is `docker compose up` — Postgres, Redis, the API, and the Vite
dev server run as containers, with each service's env injected by compose and pending migrations
applied on start. Config is read strictly from the environment (`apps/api/src/config.ts`): a
missing value is an error, never a silent default. There is **no in-process `.env` loader** — in
a container the env comes from compose, on the host (tests, CI) from the environment; `.env.example`
only documents suggested host values. No Caddy in dev — the production edge (ADR-0002) is the
deploy slice. Container topology and its gotchas (container-networked env, IPv4 healthcheck) live
inline in `docker-compose.yml`.

Why: one command brings the whole stack up identically on any machine — no locally-installed
Postgres/Redis to drift or set up. Injecting env through compose keeps host and container config
the same *shape* (one schema) differing only in *values* (DB host is the `postgres` service, the
server binds `0.0.0.0`). Dropping the in-process loader leaves a single way to read config — the
environment — the same in container, test, and CI, and lets config fail loud instead of masking a
missing var with a fallback. Keeping topology + gotchas next to the services they configure keeps
the operational knowledge where it is used.

Rejected: an in-process `.env` loader (`dotenv` / `process.loadEnvFile`) — a second, code-level
source of config truth that diverges from how prod injects env and silently hides missing vars
(removed in this slice). Host-installed services — version drift and setup friction, not
reproducible. Caddy in dev — the edge belongs to the deploy slice (ADR-0002); duplicating it into
the inner loop buys nothing.
