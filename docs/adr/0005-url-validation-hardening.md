# ADR-0005 — URL validation hardening

Status: accepted

Decision: A destination must pass a single shared `urlSchema` (`packages/shared`) before
it is shortened. It is trimmed, length-capped, parsed with the WHATWG `URL`, normalized to
`href`, and rejected unless it is a public `http`/`https` link. Rejected classes:

- non-`http(s)` schemes — `javascript:`, `data:`, `file:`, `ftp:`, …
- embedded credentials (`user:pass@host`)
- our own host (`jai.lu`) — a pointless redirect loop
- `localhost` / `*.localhost`
- bare IP addresses (IPv4, IPv6, and integer/hex forms the URL parser normalizes)
- hosts with no real public TLD — single-label, one-char TLD, and RFC 2606/6761
  special-use TLDs (`.local`, `.internal`, `.test`, …)

Each rejection surfaces as a stable error code, not prose — the caller localizes it (ADR-0007).

Why: the audience is security-first, so the shortener refuses the conventional abuse and
mistake classes up front. The target URL is **never fetched server-side**, so this is pure
validation + normalization — there is no SSRF surface to begin with, and the host rejects
keep obviously-internal or non-routable targets out of the store. The schema is browser-
safe (no Node APIs) so the client form reuses the exact same rules (ADR-0003).

Rejected: fetching the URL to "verify" it (introduces SSRF); allowing any scheme (`javascript:`
in a redirect is an XSS vector); depending on the full Public Suffix List (heavy, and a
shape check — a dotted host ending in an alphabetic/punycode TLD — catches the real mistakes).
