# ADR-0002 — Single-origin deployment

Status: accepted

Decision: In production the Hono server serves the built SPA, the `/api/*` routes, and the
`/:code` redirect from one origin and one container; dev uses Vite with an `/api` proxy.

Why: same-origin removes CORS and makes passkey/WebAuthn RP-ID and session cookies trivial;
one container fits railgun's single loopback-port shape.

Rejected: separate web/api origins (CORS, cookie/RP-ID friction, two deploys).
