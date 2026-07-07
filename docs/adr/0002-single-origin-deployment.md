# ADR-0002 — Single-origin deployment behind Caddy

Status: accepted

Decision: In production Caddy is the edge on one origin — it terminates TLS, serves the built
SPA as static files, sets security headers, and reverse-proxies `/api/*` and `/:code` to the
Hono API. Hono is API + redirect only; it never serves static assets. Dev runs the dockerized
Vite dev server (`pnpm dev`) with an `/api` proxy.

Why: single origin removes CORS and makes passkey/WebAuthn RP-ID and session cookies trivial;
Caddy is better than Hono at static, TLS and headers, and matches the production host's single
loopback-port convention.

Rejected: Hono serving static (worse at it, mixes concerns); separate web/api origins (CORS,
cookie/RP-ID friction).
