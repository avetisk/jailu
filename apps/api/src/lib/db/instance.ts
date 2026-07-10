import { config } from "@jailu/api/lib/config"
import type { Database } from "@jailu/api/lib/db/schema"
import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool(config.db.pool),
  }),
})
