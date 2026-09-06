# jailu — Security Audit

**Scope.** The full jailu codebase (`apps/api`, `apps/web`, `packages/shared`) and its dev/build surface, at commit `41fc7f4` (2026-07-10).

**Method.** A multi-agent audit: an attack-surface map, a 12-dimension parallel review (injection, URL-validation bypass, SSRF, redirect abuse, authz/abuse, crypto/codegen, secrets/config, dependencies/supply-chain, docker/infra, error-handling/info-leak, headers/transport, web/client), and **3-lens adversarial verification of every candidate finding** — only findings that survived a code-fact lens, a defense lens, and a reachability/severity lens are reported. Every command run was read-only; no file was modified.

**Result.** 0 critical - 0 high - 2 medium - 7 low - 3 info. No injection, SSRF, XSS, header-splitting, or committed secret was found, and the URL-validation core resisted a dedicated bypass campaign; the findings are abuse-resistance and operational hardening. Full detail below.

> This is a point-in-time review. It complements — it does not replace — the planned Slice 3c threat model.

---

## Executive summary

jailu's first-party code is small, tightly validated, and defends its crown jewel well. The URL-validation pipeline (`shortenableUrlSchema`) survived a dedicated bypass campaign: WHATWG-URL normalization plus a scheme allowlist, credential rejection, IP-literal and non-public-TLD filtering, and a 2048-char cap combine so that `javascript:`/`data:`/`file:`, embedded credentials, and internal/SSRF targets are all unreachable — and the server never fetches the submitted URL, so there is no SSRF surface to begin with. SQL access is fully parameterized through kysely, the redirect `Location` header is CRLF-safe by construction, the redis key path is charset-restricted and RESP-framed, and the React SPA has no XSS sink. No injection, no header-splitting, no secret was committed anywhere.

What needs attention is almost entirely **abuse-resistance and operational hardening the roadmap already plans, plus one reachable-now DoS the roadmap does *not* cover.** The API has no authentication, no rate limiting, and — critically — no request body-size limit, so an unauthenticated caller can flood the durable Postgres store or OOM the single API process. Secondary issues are all defense-in-depth or dev-environment hygiene: the redis cache is wired as a hard dependency of the redirect hot path (a cache blip becomes a full outage), the pg pool has no fail-fast timeouts, the dev compose stack exposes trivially-authenticated Postgres/Redis on all interfaces, containers run as root, and the SPA's security headers live at a Caddy edge that is not yet in the repo.

**Headline counts: 0 critical, 0 high, 2 medium, 7 low, 3 info (12 findings).** Two findings are reachable now (the missing body-size limit; the dev-stack datastore exposure); the rest are genuine gaps the roadmap's Slice 3b (rate limiting), Slice 5 (auth/ownership), and deploy slice (Caddy edge) are scheduled to close. Twelve additional candidate findings — CRLF splitting, SQLi, redis injection, log injection, IDN homoglyphs, CORS, error-body infoleak, and others — were investigated and dismissed as already-mitigated or intended behavior; they are summarized under Verified controls.

## Scope & methodology

**What was audited — the *built* surface, not the aspirational spec.** jailu is a pnpm monorepo: `apps/api` (Hono on Node, kysely/pg, ioredis), `apps/web` (React SPA behind Vite), and `packages/shared` (zod value schemas shared by both). The reachable surface is deliberately tiny:

- `POST /api/links` — unauthenticated; validate URL → mint a random 7-char code → insert into Postgres → return a short URL built from injected `PUBLIC_BASE_URL`.
- `GET /:code` — unauthenticated; regex-gate the code → redis-then-Postgres lookup → `302` redirect to the stored destination.
- `GET /api/health` — unauthenticated; returns a static `{status:"ok"}`.
- The dev Vite proxy, the dockerized dev stack (`docker-compose.yml`, two dev Dockerfiles), config/secrets handling, and the CI/build inputs.

Auth, rate limiting, and the production Caddy edge are explicitly *not yet built* (Slices 3b/5 and the deploy slice), so they are assessed as **known gaps**, not as controls in place.

**How.** The review proceeded in three stages:

1. **Attack-surface map** — every entry point traced to its sinks: `url` → Postgres INSERT, `url` → `Location` header, `url` → JSON body, `code` → redis key, `code` → Postgres SELECT, and the two web render/clipboard sinks. Trust boundaries (client↔api, api↔pg, api↔redis, config/secrets, proxy/edge) and outbound calls (none) were enumerated.
2. **12-dimension fan-out** — the map was probed across injection, url-validation-bypass, redirect-abuse, authz-and-abuse, crypto-and-codegen, secrets-and-config, dependencies/supply-chain, docker-infra, error-handling/infoleak, headers-and-transport, and web-client dimensions.
3. **3-lens adversarial verification** — every candidate was re-checked against the real code through a *code-fact* lens (do the cited lines say what the finding claims?), a *defense* lens (does an existing control already neutralize it?), and a *reachability/severity* lens (is there a realistic PoC, or is it hardening?). Only findings that survived all three lenses are reported below; severities here reflect that verification and may differ from the raw candidate claim.

Every command run was read-only; no file was modified.

## Findings

Grouped by severity, highest first. Duplicates surfaced across multiple dimensions have been merged.

---

### 1. No request body-size limit — unauthenticated memory-exhaustion DoS on `POST /api/links`

- **Severity:** Medium
- **Status:** Exploitable (reachable now)
- **Location:** `apps/api/src/app.ts:21`; the too-late guard at `packages/shared/src/schemas.ts:34`; `apps/api/src/index.ts:11`

**Description.** `POST /api/links` is guarded only by `zValidator("json", shortenRequest)`. The `@hono/zod-validator` `"json"` target calls `c.req.json()`, which **buffers the entire request body and runs `JSON.parse` before the schema executes** — so `shortenableUrlSchema`'s `MAX_URL_LENGTH = 2048` cap (a `.superRefine` on the already-parsed `url` string) cannot bound the raw payload. Neither Hono (`^4.12.27`) nor `@hono/node-server` (`^2.0.8`) applies a default body-size limit, `serve()` is called with no size option, and a grep confirms zero `.use()` / `bodyLimit` middleware anywhere in `apps/api/src`.

**Impact / exploit.** An attacker sends `POST /api/links` with `Content-Type: application/json` and a multi-hundred-MB body (`{"url":"<huge>"}`, or even `{"junk":"<huge>"}` with no valid `url`). The single Node process buffers the raw bytes plus a parsed-string copy (~2–3× the payload) into the V8 heap before zod rejects it. A handful of concurrent such requests drive RSS into multiple GB and can OOM-kill the process on the shared host; recovery is a restart. **This gap is *not* closed by the planned rate limiter** — a rate limiter throttles request *count*, not per-request body size, so one permitted request can still be arbitrarily large. The two controls are independent.

*Severity calibration:* the amplification is linear (the attacker must actually upload every byte it wants resident, costing bandwidth), the impact is availability-only with no data/integrity exposure, and recovery is a restart — hence Medium, not High. But it is genuinely reachable today and independent of the roadmap, which is why it outranks the future-work items below.

**Remediation.** Mount Hono's `bodyLimit` on the create route, sized a few KB above a 2048-char URL plus JSON envelope, so oversized payloads `413` before buffering/parsing:

```ts
app.use('/api/links', bodyLimit({ maxSize: 8 * 1024 }))
```

This should land independently of, and before, the Slice 3b rate limiter.

---

### 2. Unauthenticated, unthrottled link creation — unbounded Postgres growth / storage exhaustion

- **Severity:** Medium
- **Status:** Future-work (roadmap Slice 3b / Slice 5)
- **Location:** `apps/api/src/app.ts:21` (route), `apps/api/src/links/repository.ts:11-18` (insert), migration `db/migrations/2026_07_08_0001_create_links.ts` (unbounded `originalUrl text` column), `apps/api/src/config.ts:13-16` (REDIS_URL provisioned for the planned limiter)

**Description.** `createApp()` chains only `zValidator` on `POST /api/links` — zero `.use()`, no auth, no rate limit, no per-client quota, no ownership model — and `index.ts` serves it verbatim. Every accepted call performs an unconditional INSERT of `{linkCode, originalUrl}` via `insertLink`, with no dedup/upsert and no per-caller accounting. `originalUrl` is a plain `NOT NULL text` column with no length cap in the schema; the only bound is the app-layer 2048-char limit. There is a UNIQUE index on `linkCode` (the collision authority) but **none on `originalUrl`**, so distinct-query-string spam is never collapsed. Postgres is the durable source of truth, so this growth does not self-evict the way the redis cache does.

**Impact / exploit.** An unauthenticated attacker scripts a tight `POST /api/links` loop with valid but unique ~2KB URLs from a handful of IPs. Each request that passes `shortenableUrlSchema` writes a durable ~2KB row with no ceiling, inflating the `links` table and its unique index until disk pressure on the *shared* prod Postgres degrades inserts for jailu and potentially co-tenant services on the shared host. With no ownership model, the spam cannot be attributed or bulk-revoked. Ingest is bounded by the single Node process doing one synchronous PG round-trip per row (hundreds–low-thousands/s), so this is disk-pressure over hours, not an instant compromise — hence a resource-exhaustion gap rather than a decisive exploit.

**Remediation.** Ship the planned Slice 3b redis-backed per-IP token bucket on `POST /api/links` (`REDIS_URL` is already provisioned for exactly this) and the Slice 5 auth/ownership model so creation is attributable and revocable. Cheap interim wins: a global insert cap, and a UNIQUE-or-upsert on `originalUrl` to fold duplicate-URL spam.

---

### 3. Dev stack publishes Postgres (weak creds) and Redis (no auth) on all host interfaces

- **Severity:** Low
- **Status:** Exploitable, but dev-only and conditional on a hostile network
- **Location:** `docker-compose.yml:19-20` (postgres `"5432:5432"`), `:34-35` (redis `"6379:6379"`), `:16-17` (creds `jailu/jailu`), `:33` (redis command, no `--requirepass`)

*(This finding merges two surfaced dimensions — secrets-and-config and docker-infra — describing the same misconfiguration.)*

**Description.** Both datastores publish with the Compose short syntax, which binds `0.0.0.0` (every host interface), not loopback. Postgres is seeded with the hardcoded default pair `jailu/jailu`; Redis runs with only `--maxmemory`/`--maxmemory-policy` and **no `requirepass`**, so it accepts unauthenticated commands. Docker's published-port DNAT rules sit in the `DOCKER` iptables chain *ahead of* a host `ufw`/`firewalld` filter — a common blind spot: "I enabled my firewall" does not close these ports. There is exactly one compose file and no loopback bind anywhere.

**Impact / exploit.** A developer runs `docker compose up` while joined to an untrusted/shared L2 segment (café/coworking Wi-Fi, a shared build box with a routable IP). Any host on that segment can:

```
psql "postgres://jailu:jailu@<dev-ip>:5432/jailu"   # read/rewrite the links table
redis-cli -h <dev-ip> -p 6379 FLUSHALL              # wipe the cache, no auth
```

Because the `jailu` role is created as a Postgres **superuser**, the attacker can escalate beyond data access to host command execution (`COPY (SELECT '') TO PROGRAM 'id'`). Blast radius is bounded to a developer's throwaway local dev data — production uses platform-injected env and never this compose file, and no secret is committed (`.env`/`.env.*` are gitignored; only `.env.example` with localhost defaults is tracked). The exploit is present in the artifact today but requires the developer to be on a hostile network with an attacker present — hence Low.

**Remediation.** Bind both publishes to loopback — `"127.0.0.1:5432:5432"` and `"127.0.0.1:6379:6379"` — which still satisfies host-side gate/tests (they already target `127.0.0.1`) while removing off-box reachability regardless of the host firewall. The api→postgres/redis path uses the compose network by service name (`:52-53`) and needs no host publish at all. Optionally add a redis `--requirepass` and a non-trivial dev `POSTGRES_PASSWORD`.

---

### 4. Redis outage on the redirect path fails hard (500) instead of degrading to Postgres

- **Severity:** Low
- **Status:** Future-work (resilience gap; contradicts documented design intent)
- **Location:** `apps/api/src/links/resolve.ts:7` (uncaught `getCachedUrl`), `apps/api/src/links/cache.ts:16-17` (`redis.getex`), `apps/api/src/redis/index.ts:11` (`lazyConnect`), `apps/api/src/app.ts:35` (handler)

**Description.** `resolveUrl()` awaits `getCachedUrl()` with no try/catch anywhere on the read or write path (the only catch in `apps/api/src` is the unique-violation retry in `unique-code.ts`). ioredis is `lazyConnect`, so the first command dials the socket; if Redis is unreachable the `getex` promise rejects, the rejection escapes the `GET /:linkCode` handler, and — since `index.ts` registers no `app.onError` — Hono's default handler returns a `500`. Crucially, `resolve.ts` branches only on hit vs miss (`cached !== null`); a *rejected* read is never coerced to a miss, so it never falls through to `findLinkByCode()`. This directly contradicts the file's own stated invariant ("the cache is a disposable accelerator; Postgres is the source of truth"). `cacheUrl()` on the write side has the same exposure.

**Impact / exploit.** When Redis restarts, is OOM/evicted, or its connection limit is exhausted, **every** `GET /:code` returns `500` even though Postgres holds every destination and is healthy. A soft cache blip becomes a total outage of the product's single core function. The trigger is operational (not a crafted request), and an attacker cannot exhaust Redis connections through the HTTP surface because the app uses one shared client — hence a resilience gap, not an attacker-driven exploit. Note: the `500` body is Hono's generic `"Internal Server Error"`, so there is **no information disclosure** (the original "infoleak" framing is incorrect; this is purely availability).

**Remediation.** Treat a cache-read error as a miss and fall through to Postgres; swallow write-side rejections:

```ts
let cached: string | null = null
try { cached = await getCachedUrl(code) } catch (e) { logger.warn(...) }
// ... and swallow cacheUrl() rejections on the write path
```

The cache should only ever be able to slow the path, never break it.

---

### 5. `pg.Pool` created with defaults — no acquire or statement timeout

- **Severity:** Low
- **Status:** Future-work (resilience/backpressure gap)
- **Location:** `apps/api/src/db/index.ts:14`

**Description.** The pool is `new pg.Pool({ connectionString })` with no `max`, no `connectionTimeoutMillis`, and no `statement_timeout`. node-postgres defaults to `max: 10` and `connectionTimeoutMillis: 0` — an **infinite** acquire wait: once all 10 connections are checked out, further queries queue indefinitely rather than failing fast to a `503`. With no `statement_timeout`, no server-side bound caps a slow query.

**Impact / exploit.** Under a concurrent flood on the unauthenticated paths, the pool saturates and request 11+ block in the acquire queue with no timeout, so the API appears hung instead of shedding load. *Two overstatements in the original candidate are corrected:* (a) the queries here are indexed single-row point operations on `linkCode` with no attacker-controllable predicate, so the "slow query pins a connection" lever is not realistically reachable, and (b) because those queries return in sub-millisecond time, the acquire queue drains automatically when the flood stops — recovery is *not* restart-gated. The residual is a genuine absence of fail-fast backpressure. Note `GET /api/health` is static today and does *not* touch the pool (see finding 8), so the "health probe blocks" concern applies only to a future DB-backed probe.

**Remediation.** Configure the pool explicitly — an explicit `max`, a finite `connectionTimeoutMillis` (fail-fast to `503`), and a `statement_timeout` — as a backstop paired with the Slice 3b rate limiter, so the pool is a secondary bound rather than the only one.

---

### 6. `COPY . .` bakes untracked private notes into the image (`.dockerignore` gap)

- **Severity:** Low
- **Status:** Exploitable when an image is shared/exported (realistic for a case study)
- **Location:** `.dockerignore` (missing entries), `apps/api/Dockerfile:22` and `apps/web/Dockerfile:19` (`COPY . .`)

**Description.** Both Dockerfiles do `COPY . .`. `.dockerignore` excludes `node_modules`, `dist`, `.git`, `.github`, `docs`, `.claude`, `.env`, and `.env.*` — but **not `CLAUDE.local.md` or `HANDOFF.md`**, both of which exist at the repo root and are git-ignored precisely to keep internal deploy topology out of "the public case-study repo." Docker does not consult `.gitignore`, so `COPY . .` bakes both into an image layer. `CLAUDE.local.md` discloses internal deploy topology (a private prod-host path and internal doc paths); `HANDOFF.md` leaks work-in-progress session internals.

*Correction to the original candidate:* `.t72.json` is **git-tracked** (already public), so it is not a leak and should be dropped from the recommendation. Real secrets are safe — `.env`/`.env.*` *are* excluded, so no credential is baked.

**Impact / exploit.** Any image built from these Dockerfiles is a natural artifact to hand to an interviewer, push to a registry, or `docker save`. Then `docker run --rm <img> cat /app/CLAUDE.local.md` (or `docker history`/layer extraction) recovers the internal topology the untracked-file convention was meant to keep private. No such push/export flow exists in-repo today, so the disclosure is contingent on the image crossing a trust boundary — hence Low, but realistic given the repo's interview purpose. The leaked content is infra topology, not credentials.

**Remediation.** Add `CLAUDE.local.md` and `HANDOFF.md` (or a broader `*.local.*` + `HANDOFF.md` pattern) to `.dockerignore`, or — better — replace `COPY . .` with an explicit allowlist (`COPY apps/ packages/ tsconfig.base.json ./`) so only build inputs enter the image.

---

### 7. Containers run as root — no `USER` directive

- **Severity:** Low
- **Status:** Future-work (blast-radius multiplier; carry into the prod image)
- **Location:** `apps/api/Dockerfile:7`, `apps/web/Dockerfile:7` (both `FROM node:24-alpine`, no `USER`)

**Description.** Neither Dockerfile drops privileges, so `tsx watch` (API) and `vite` (web) — both bound to `0.0.0.0` — run as uid 0 inside their containers. These are the only two Dockerfiles in the repo; there is no `user:` override in compose and no prod image yet.

**Impact / exploit.** This is not a standalone reachable exploit — it only widens the blast radius *if* a separate code-execution bug lands (a compromised dev dependency executing at install/dev, or a bug in the network-exposed vite/tsx dev server). No such reachable RCE exists in first-party code, so it is defense-in-depth. It matters most once a production image is derived from these files.

**Remediation.** Add `USER node` after the install layer (the node:alpine images ship a `node` user, uid 1000) with `chown` on `/app`. Carry a non-root user, read-only root filesystem, and dropped capabilities into the eventual production image — route the prod-side hardening through the deploy platform, which owns that host.

---

### 8. `/api/health` is a static literal that does not probe Postgres or Redis

- **Severity:** Low
- **Status:** Future-work (observability gap under the planned deploy model)
- **Location:** `apps/api/src/app.ts:20`

**Description.** `GET /api/health` returns a hardcoded `{status:"ok"}` and never touches the pg pool or redis client. On the information-disclosure axis this is exemplary — it leaks nothing — but it is a **liveness** check masquerading as **readiness**: it answers `200` while Postgres or Redis is down and every shorten/redirect is `500`-ing. This endpoint is already load-bearing: `docker-compose.yml` wires it as the api container's healthcheck, and the `web` service gates its start on `api: service_healthy`.

**Impact / exploit.** Not an attacker-triggerable vulnerability — a reliability/observability gap. If DB credentials rotate or a datastore goes down at runtime, the container stays green and an orchestrator (or the planned production Caddy edge) keeps a broken instance in rotation, delaying outage detection. Reproducible: `docker compose stop postgres`, then `/api/health` still returns `200` while `POST /api/links` and `GET /:code` return `500`.

**Remediation.** Have the handler run a cheap dependency probe (`SELECT 1` via kysely + a redis `PING`, with a short timeout) and return non-`200` with a **coarse** `{db, redis}` boolean/enum map — no raw error text, to preserve the current zero-disclosure property. Consider splitting a static liveness route from a probing readiness route.

---

### 9. API sets no HTTP security headers; the only defense (Caddy edge) is not in the repo

- **Severity:** Low
- **Status:** Future-work (defense-in-depth; the real gap is the absent edge)
- **Location:** `apps/api/src/app.ts:18` (no middleware); `docs/adr/0002-single-origin-deployment.md:5-6` (delegates headers to Caddy); `apps/web/Dockerfile` ("No Caddy here"); `docker-compose.yml` (API exposed directly on `3000`)

**Description.** `createApp()` chains only `zValidator` and route handlers — no `secureHeaders`/CSP/HSTS/`X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy` anywhere. ADR-0002 explicitly delegates security headers and TLS to a production Caddy edge, but **that edge is not implemented in this repo**, and nothing fails loud if it is missing or misconfigured — a fail-open design.

**Impact / exploit.** *Scoped carefully:* the Hono API emits only JSON and `302` redirects — never an HTML document — so framing/CSP/nosniff attacks have essentially no surface on the API origin, and adding `secureHeaders()` there is low-value. The genuine gap is the **SPA**: when the static build is eventually served, its HTML/JS needs framing protection (`X-Frame-Options`/CSP `frame-ancestors`), `nosniff`, `Referrer-Policy`, and HSTS — all of which live entirely at the not-yet-built edge. In the current stack the SPA is served by the Vite dev server on localhost (plain HTTP, no external exposure), so HSTS/clickjacking have no live surface today.

**Remediation.** Primarily: make the Caddy edge a hard, tested prerequisite gating any exposure of the SPA, and set the SPA's headers there. Secondarily, add Hono `secureHeaders()` as a same-origin baseline so a single misconfigured/absent edge does not strip all protection.

---

### 10. Short-code entropy is 42 bits (64⁷) — enumeration resistance rides on the absent rate limiter

- **Severity:** Info
- **Status:** Future-work (subsumed by the Slice 3b/5 rate-limit control)
- **Location:** `apps/api/src/links/generate-link-code.ts:14`; `packages/shared/src/constants.ts` (`LINK_CODE_LENGTH = 7`)

**Description.** Codes are 7 base64url chars = 64⁷ ≈ 2⁴² of keyspace. The **cryptographic quality is sound** (CSPRNG `randomBytes`, unbiased `byte % 64` over an exactly-64-symbol alphabet — see Verified controls), so there is no predictability angle, and collision-safety is separately guaranteed by the unique index + retry loop. The only residual concern is bulk enumeration of the anonymous `GET /:code` oracle, whose sole effective defense is rate limiting.

**Impact / exploit.** Enumeration hit-rate = occupancy / 2⁴². For a case-study shortener the table is sparse, so even a million random probes expect ≈ 0 valid hits, and harvesting a meaningful sample would need billions of requests. It becomes marginally practical only at very large occupancy *and* with no throttle. This is essentially the missing-rate-limit gap (finding 2) restated through a codegen lens; the codegen itself is correct.

**Remediation.** Ship rate limiting on the redirect path as the primary control (already planned). Optionally bump `LINK_CODE_LENGTH` to 8–10 (keyspace → 2⁴⁸–2⁶⁰) — a one-constant change, since the generator, the `/^[A-Za-z0-9_-]{3,64}$/` schema regex, and the DB column all already accommodate longer codes. Keep the CSPRNG + unbiased-modulo generator as-is.

---

### 11. No supply-chain release-age cooldown (`minimumReleaseAge`) despite bleeding-edge pins

- **Severity:** Info
- **Status:** Future-work (supply-chain hygiene)
- **Location:** `pnpm-workspace.yaml`

**Description.** The workspace sets `allowBuilds: esbuild: true` (good — postinstall lifecycle scripts are restricted to esbuild only) but no `minimumReleaseAge` cooldown, and there are no `overrides`/`patchedDependencies`. Meanwhile the tree pins very fresh caret versions across the stack (react `^19.2.7`, vite `^8.1.3`, hono `^4.12.27`, zod `^4.4.3`, `pnpm@11.6.0`). pnpm 11 natively supports `minimumReleaseAge` to quarantine brand-new releases — the standard defense against the compromised-release / account-takeover class.

**Impact / exploit.** Not reachable automatically: CI (`ci.yml`) and both Dockerfiles all install with `--frozen-lockfile`, and the lockfile carries 321/321 sha512 `integrity:` hashes, all from `registry.npmjs.org` with zero git/tarball/http sources — so a poisoned in-range release cannot enter any build silently. The only ingress is a developer running `pnpm update`/`pnpm add` locally, which regenerates the lockfile and can resolve a minutes-old poisoned release of an *imported* runtime dep (hono/pg/ioredis) or build-time dep (vite/esbuild); the esbuild-only `allowBuilds` blocks arbitrary postinstall RCE but not code that is actually imported and executed. Hence a hardening gap, not an active vulnerability.

**Remediation.** Add `minimumReleaseAge` (e.g. `4320` minutes / 3 days) in `pnpm-workspace.yaml`; keep `--frozen-lockfile` everywhere (already done) and the esbuild-only allowlist minimal.

---

### 12. Base images pinned by mutable tag, not digest

- **Severity:** Info
- **Status:** Future-work (adopt when the production image lands)
- **Location:** `docker-compose.yml:14` (`postgres:17-alpine`), `:30` (`redis:7-alpine`), `apps/api/Dockerfile:7` & `apps/web/Dockerfile:7` (`node:24-alpine`)

**Description.** All base images float on mutable tags with no `@sha256:` digest, so `docker compose build`/`pull` at different times can silently resolve to different image contents — a reproducibility/tamper-evidence gap.

**Impact / exploit.** No runtime exploit: harm requires an out-of-band precondition (an upstream tag re-push or registry/mirror compromise) followed by a rebuild, and everything here is the dev-only stack (there is no production Dockerfile yet). The npm dependency layer is already reproducible via `--frozen-lockfile`; only the OS base layer floats.

**Remediation.** Pin base images by digest (`node:24-alpine@sha256:...`) and bump deliberately. Low priority for the dev stack; bake it into the forthcoming production Dockerfile where a poisoned rebuild would reach a deployed artifact.

## Verified controls (checked and found solid)

The negative space is as important as the findings. Each of the following was actively probed and confirmed to hold against the code as written.

1. **URL-validation crown jewel — no bypass found.** `shortenableUrlSchema` (`packages/shared/src/schemas.ts:24-43`, helpers in `utils.ts`) parses with WHATWG `URL`, then checks `url.protocol` against `{http:, https:}` (`ALLOWED_PROTOCOLS`, `utils.ts:62`) — so `javascript:`/`data:`/`file:` are unreachable. Embedded credentials are rejected via `url.username`/`password` (blocks `user@host` phishing); IP literals are caught on the *already-normalized* hostname (WHATWG first normalizes decimal/hex/integer IPv4 to dotted-quad); localhost/self-host/non-public-TLD are rejected; length is capped at 2048 before the regex runs. The validator's parse and the final `.transform(v => new URL(v).href)` strip tab/CR/LF identically, so the checked value and the stored value cannot diverge. The `PUBLIC_DOMAIN` regex uses a mandatory literal-dot delimiter (no `(a+)+` ambiguity) over length-bounded input — no ReDoS.
2. **No SSRF surface.** A grep for `fetch`/`http.request`/`axios`/`undici`/`got`/`net.connect`/`dns` across `apps/api/src` and `packages/shared/src` returns nothing. The submitted URL is stored and later emitted as a `302` `Location` only — **never fetched server-side** (`schemas.ts:23` comment confirmed). The localhost/IP/non-public-TLD rejections are anti-loop hygiene, not a load-bearing SSRF control.
3. **No SQL injection.** The only two DB touch points both use kysely's parameterizing builder: `repository.ts:15` (`.insertInto("links").values(...)`) and `repository.ts:22` (`.where("linkCode","=",linkCode)`). The only `sql\`` usages are static template literals wrapping `gen_random_uuid()` / `now()` in migration `2026_07_08_0001` with **zero** variable interpolation.
4. **No redirect header injection.** `app.ts:39` emits `c.redirect(originalUrl, 302)` where `originalUrl` is a WHATWG-serialized `href` that structurally cannot contain a bare CR/LF; scheme is locked to http/https. `@hono/node-server` rejecting raw CR/LF header values is an additional (non-load-bearing) backstop. Empirically, `new URL("http://example.com/\r\nSet-Cookie:x").href` → `http://example.com/Set-Cookie:x`.
5. **No redis key/command injection.** `linkCodeSchema` (`schemas.ts:18`, `/^[A-Za-z0-9_-]{3,64}$/`) excludes `:`, whitespace, and RESP metacharacters, and rejects bad codes at `app.ts:31` before any redis call; the code is passed as a discrete RESP-framed argument to `getex`/`set`. Cache values only ever come from Postgres (`resolve.ts:12-14`), so there is no cross-code cache-poisoning write.
6. **No XSS.** `apps/web` renders the server-built short URL through React's auto-escaped JSX and `navigator.clipboard.writeText`; error codes come from a fixed `URL_ERROR` set rendered via i18next (safe despite `escapeValue:false`, because React escapes the text node and no user string is interpolated into a catalog value). No `dangerouslySetInnerHTML`/`innerHTML`/`eval` anywhere in `apps/web/src`.
7. **No log injection.** The three `logger.*` call sites (`index.ts:12`, `db/migrate.ts:10,16`) interpolate only server config, on-disk migration names, and kysely enums; the two request handlers make **no** logger calls, so no request field reaches the log stream.
8. **Cryptographically sound code generation.** `generate-link-code.ts:14` mints codes from `node:crypto` `randomBytes` (CSPRNG) over an exactly-64-symbol alphabet, so `byte % 64` is unbiased (64 divides 256 — no modulo skew, no rejection sampling needed). Collision-safety is backstopped by the `linkCode` UNIQUE index + a bounded 5-retry optimistic mint (`unique-code.ts`).
9. **Host-poisoning-resistant minted links.** `shortUrl` is built from injected `PUBLIC_BASE_URL` config (`config.ts:12`, `app.ts:24`), **never** from `c.req.url`/the Host header, so an attacker cannot steer the minted short URL.
10. **Fail-loud config.** `config.ts` validates env with no defaults; `PUBLIC_BASE_URL` and `REDIS_URL` carry `z.url({protocol})` allowlists; a malformed value crashes startup rather than degrading silently.
11. **No leaked stack traces.** With no custom `app.onError`, Hono's default handler returns a static `"Internal Server Error"` `500` (no stack, no `err.message`, no pg error fields); validation `400`s reflect only the fixed public `URL_ERROR` code vocabulary and never echo the attacker's raw input.
12. **No secrets committed.** `.env`/`.env.*` are gitignored (confirmed) and hold only localhost dev values; only `.env.example` (placeholders) is tracked; `.dockerignore` excludes `.env*` and `.git` from images.
13. **Correct absence of CORS.** The API attaches no cookies/session/Authorization, so the browser default same-origin policy applies with no ambient authority to abuse — adding a permissive `Access-Control-Allow-Origin` would be the risk, and none is present.

**Due-diligence note.** Twelve candidate findings were investigated and dismissed after 3-lens verification: `302` CRLF response-splitting, SQL injection, redis key/command injection, log injection, IDN homoglyph/lookalike domains (intended shortener behavior — resolves to a real public domain over http/https, not a scheme/credential/SSRF bypass), redirect-time scheme re-check (mitigated by the single validated write path), `DATABASE_URL` protocol allowlist (operator-injected trusted config, no attacker path), the unmaintained transitive `tsconfck@3.1.6` (dev-only, no CVE), the absent `app.onError` (framework default is safe), the validation `400` body (fixed domain codes only), and the absent CORS (correct default). Each is documented above under Verified controls or was a no-reachable-harm hygiene note.

## Known gaps & future work

These are planned-but-absent controls; their current-state severity is captured in Findings and repeated here for the roadmap view.

1. **Rate limiting (Slice 3b).** No throttle on either unauthenticated path. This is the primary control behind findings 2 (link-creation flooding) and 10 (code enumeration). `REDIS_URL` is already provisioned for a redis-backed per-IP token bucket. *Current severity: Medium (via finding 2).*
2. **Auth / ownership model (Slice 5).** No authentication and no ownership, so created links cannot be attributed or bulk-revoked. Compounds finding 2. *Current severity: Medium.*
3. **Body-size limit (unscheduled — recommend pulling forward).** *Not* covered by the rate limiter; this is finding 1, reachable now. *Current severity: Medium.* Recommend landing before Slice 3b.
4. **Caddy edge / security headers + TLS (deploy slice, ADR-0002).** The SPA's framing/nosniff/HSTS protection lives entirely at an edge not yet in the repo, and nothing fails loud if it is missing (finding 9). *Current severity: Low, because no production HTML surface is exposed yet.*
5. **Datastore resilience & container hardening (deploy slice).** pg-pool timeouts (finding 5), non-root containers + read-only rootfs (finding 7), digest-pinned base images (finding 12), and a dependency-probing readiness check (finding 8) should land with the production image — largely owned by the deploy platform.

## Prioritized recommendations

1. **Add a `bodyLimit` on `POST /api/links` (finding 1) — do this first.** One line, closes the only reachable-now DoS on the API, and is independent of the roadmap. `app.use('/api/links', bodyLimit({ maxSize: 8 * 1024 }))`.
2. **Make the redirect path degrade gracefully when Redis is down (finding 4).** Wrap `getCachedUrl`/`cacheUrl` so a redis error becomes a cache miss that falls through to Postgres. Small change, removes a full-outage single-point-of-failure on the product's core function.
3. **Bind the dev compose datastores to loopback (finding 3).** `127.0.0.1:5432:5432` / `127.0.0.1:6379:6379`, plus a redis `requirepass` and non-default dev creds. Zero-cost, removes off-box reachability of a superuser Postgres and an unauthenticated Redis.
4. **Ship the Slice 3b rate limiter and Slice 5 auth/ownership (findings 2, 10).** The primary abuse control for unbounded creation and code harvesting; add an interim global insert cap and an `originalUrl` UNIQUE/upsert as cheap stopgaps.
5. **Fix the `.dockerignore` gap (finding 6).** Add `CLAUDE.local.md` and `HANDOFF.md` (drop the tracked `.t72.json`), or switch `COPY . .` to an explicit allowlist.
6. **Harden the pg pool (finding 5).** Explicit `max`, finite `connectionTimeoutMillis`, `statement_timeout` — as a backstop paired with the rate limiter.
7. **Upgrade `/api/health` to a coarse readiness probe (finding 8).** `SELECT 1` + redis `PING`, returning a `{db, redis}` map with no raw error text.
8. **Carry into the production image (deploy slice):** non-root `USER node` + read-only rootfs + dropped caps (finding 7), digest-pinned bases (finding 12), and the Caddy edge as a tested prerequisite that sets the SPA's security headers and terminates TLS (finding 9).
9. **Adopt a supply-chain cooldown (finding 11):** `minimumReleaseAge: 4320` in `pnpm-workspace.yaml`; keep `--frozen-lockfile` and the esbuild-only `allowBuilds` as-is.
10. **Optionally lengthen link codes to 8–10 chars (finding 10)** if a capability-URL threat model is adopted — a one-constant change; keep the (correct) CSPRNG generator.