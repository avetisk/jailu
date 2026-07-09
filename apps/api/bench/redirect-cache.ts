// A benchmark, not app code: it measures per-operation latency — so the awaits are deliberately
// sequential (not batched with Promise.all) — and reports timings to stdout.
/* oxlint-disable no-await-in-loop, no-console */
import { performance } from "node:perf_hooks"
import { exit } from "node:process"

import { redis } from "@jailu/api/src/cache"
import { db } from "@jailu/api/src/db"
import { findLinkByCode, insertLink } from "@jailu/api/src/links/repository"
import { resolveTarget } from "@jailu/api/src/links/resolve-target"

// Redirect-path microbenchmark: cache-aside (redis-then-Postgres) vs Postgres-only, over a warm
// working set. Answers the spec's "benchmark before assuming the cache wins" (ADR-0010). Run
// against the dev backing services: `docker compose up -d postgres redis` with a migrated DB, then
// `pnpm --filter @jailu/api bench:redirect`.
const SEED = 500
const ITERATIONS = 5000

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index] ?? 0
}

async function measure(
  label: string,
  codes: string[],
  run: (code: string) => Promise<unknown>,
): Promise<void> {
  const samples: number[] = []
  for (let i = 0; i < ITERATIONS; i += 1) {
    const code = codes[i % codes.length] ?? ""
    const start = performance.now()
    await run(code)
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  const total = samples.reduce((sum, n) => sum + n, 0)
  const ops = Math.round(ITERATIONS / (total / 1000))
  console.log(
    `${label.padEnd(24)} p50=${percentile(samples, 50).toFixed(3)}ms  ` +
      `p95=${percentile(samples, 95).toFixed(3)}ms  ` +
      `p99=${percentile(samples, 99).toFixed(3)}ms  ${ops} ops/s`,
  )
}

async function main(): Promise<void> {
  console.log(`seeding ${SEED} links…`)
  const codes: string[] = []
  for (let i = 0; i < SEED; i += 1) {
    const link = await insertLink(`https://example.com/${i}`)
    codes.push(link.linkCode)
  }

  // Warm the cache so the cache-aside path measures steady-state hits, not the first-touch miss.
  await redis.flushdb()
  for (const code of codes) {
    await resolveTarget(code)
  }

  console.log(`\n${ITERATIONS} lookups over ${SEED} codes:\n`)
  await measure("postgres-only", codes, (code) => findLinkByCode(code))
  await measure("cache-aside (redis→pg)", codes, (code) => resolveTarget(code))

  await db.deleteFrom("links").where("linkCode", "in", codes).execute()
  await redis.flushdb()
  await db.destroy()
  await redis.quit()
}

main().catch((error: unknown) => {
  console.error(error)
  exit(1)
})
