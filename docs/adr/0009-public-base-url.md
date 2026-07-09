# ADR-0009 — Short links from a configured public base URL

Status: accepted

Decision: The minted short URL is built by appending the link code to a **required
`PUBLIC_BASE_URL` config value** — ``new URL(`/${linkCode}`, publicBaseUrl)`` in `app.ts` — never
derived from the inbound request (`c.req.url` or the `Host` header). `PUBLIC_BASE_URL` is
validated fail-loud at boot (`z.url({ protocol: /^https?$/u })`, http/https only, no default; see
`config.ts`) and injected into `createApp` from config, per environment.

Why: the short URL is a **value the service owns and returns to the caller**, so it must not be
steerable by external input. Trusting the request `Host` would open Host-header injection — a
crafted or proxy-rewritten `Host` could mint links pointing at an attacker-chosen origin (a
phishing/link-poisoning vector, and cache-key confusion). It also breaks concretely in dev: the
vite proxy rewrites `Host` to the internal `api:3000`, so a `Host`-derived link would read
`http://api:3000/<code>` instead of the public origin (surfaced verifying PR #8). A configured
origin is the single trusted source; fail-loud config means a missing or invalid value stops boot
rather than silently minting wrong links.

Rejected: deriving the origin from `c.req.url` / `Host` (trusts untrusted input, poisonable, and
mints internal-hostname links in dev); a hardcoded origin (can't serve dev/preview/prod from one
build — env injection is the ADR-0006 pattern); a default fallback (a silent-wrong-value footgun,
against the no-defaults fail-loud rule in `config.ts`).
