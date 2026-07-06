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
