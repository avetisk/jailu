import { env } from "node:process"

import { loadConfig } from "@jailu/api/src/config"
import Redis from "ioredis"

const config = loadConfig(env)

// One lazy ioredis client for the redirect cache (and Slice 3b rate limiting). `lazyConnect` so
// importing the app opens no socket — health/unit tests that never touch the cache never connect;
// the first cache command dials in, mirroring pg.Pool's lazy connect in db/index.ts.
export const redis = new Redis(config.redis.url, { lazyConnect: true })
