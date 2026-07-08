import { promises as fs } from "node:fs"
import { join } from "node:path"

// The migration classes ship from this kysely subpath (0.29), not the package root.
import { FileMigrationProvider, Migrator } from "kysely/migration"

import { db } from "@/db"

// Shared by the migrate CLI and the integration-test setup so both apply the exact same
// migration set. Files live next to this module in ./migrations.
export function createMigrator(): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path: { join },
      migrationFolder: join(import.meta.dirname, "migrations"),
    }),
  })
}
