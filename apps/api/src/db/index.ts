import "@jailu/api/src/env"
import { env } from "node:process"

import { loadConfig } from "@jailu/api/src/config"
import type { Database } from "@jailu/api/src/db/schema"
import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"

const config = loadConfig(env)

// One typed Kysely instance over a pg pool. camelCase columns are quoted by kysely, so
// TS types, API JSON, and DB columns share one naming convention (spec: Data model).
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: config.database.url }),
  }),
})
