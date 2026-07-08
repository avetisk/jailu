import { exit } from "node:process"

import { db } from "@/db"
import { createMigrator } from "@/db/migrator"
import { logger } from "@/lib/logger"

const { error, results } = await createMigrator().migrateToLatest()

for (const result of results ?? []) {
  logger.info(`migration ${result.migrationName}: ${result.status}`)
}

await db.destroy()

if (error) {
  logger.error("migration failed", error)
  exit(1)
}
