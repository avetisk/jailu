// This is only for @root/.config/kysely.config.ts
import { join } from "node:path"

import { config } from "@jailu/api/lib/config"
import { PostgresDialect } from "kysely"
import { defineConfig } from "kysely-ctl"
import { Pool } from "pg"

export const dialect = new PostgresDialect({
  pool: new Pool(config.db.pool),
})

export default defineConfig({
  dialect,
  migrations: {
    migrationFolder: join(import.meta.dirname, "migrations"),
  },
  plugins: [],
  seeds: {
    seedFolder: join(import.meta.dirname, "seeds"),
  },
})
