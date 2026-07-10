import type { UUID } from "node:crypto"

import type { Generated } from "kysely"

export interface ShortLinksTable {
  id: Generated<UUID>
  originalUrl: string
  code: string
  createdAt: Generated<Date>
}

export interface Database {
  shortLinks: ShortLinksTable
}
