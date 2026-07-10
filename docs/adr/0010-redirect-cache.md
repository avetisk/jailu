# ADR-0010 — Redis cache on the redirect hot path

Status: accepted

Decision: `GET /:code` resolves through a **cache-aside** over redis (`links/resolve.ts`): read
`link:<code>`, and on a miss fall back to Postgres (the source of truth) and populate the key.
Values are `code -> originalUrl` with a **sliding one-hour TTL** — reads refresh it via `GETEX`
(`links/cache.ts`) so hot links stay warm. Redis is bounded by `maxmemory` + `allkeys-lru`
(`docker-compose.yml`), so it self-evicts under pressure; `REDIS_URL` is fail-loud config
(ADR-0009 discipline). **No invalidation logic:** destinations are immutable (ADR-0004) and there
is no disable/expiry yet (Slice 6), so a cached entry cannot go stale — the invalidation seam
lands with mutability in Slice 6.

Why: the redirect is the hot path and should not pay a database round-trip per hit. Measured
first, because the spec requires benchmarking before assuming the cache wins — a one-off local
benchmark (5000 warm lookups over 500 codes, pg + redis co-located on loopback):

|                    | p50     | p95     | p99     | throughput  |
| ------------------ | ------- | ------- | ------- | ----------- |
| postgres-only      | 0.63 ms | 1.00 ms | 1.28 ms | ~1520 ops/s |
| cache-aside (warm) | 0.28 ms | 0.49 ms | 0.65 ms | ~3300 ops/s |

The cache roughly halves p50 latency (~2.3x) and doubles throughput even against a unique-indexed
lookup with Postgres on the same host; in production, where the database is a network hop away and
redis is co-located, the gap widens. These absolute numbers are workload-, configuration-, and
topology-dependent (connection pooling, the `maxmemory` policy, where the database sits relative to
the app), so a real deployment should re-measure the cache-vs-direct trade-off — and weigh
alternatives such as Postgres tuning or memcached — against its own traffic rather than treat this
local run as settled. Misses are **not** negative-cached: codes are non-enumerable
(ADR-0005), so miss-flooding is low value for an attacker and caching misses only adds a
memory-abuse surface.

Rejected: no cache / pg-only (a DB round-trip on every redirect — measured p50 ~2.3x the cached
path, worse under real network latency); negative-caching misses (memory-abuse surface, negligible
upside given non-enumerable codes); a fixed non-sliding TTL (hot links would periodically cold-miss
on expiry; `GETEX` keeps the working set warm at no extra round-trip); building invalidation now
(speculative — nothing can mutate a destination until Slice 6).
