import type { Generated } from "kysely"

// Slice 1 keeps only the columns the core shorten + redirect actually uses. Ownership
// (ownerId), disable/expiry (disabled, expiresAt) arrive in the slices that give them
// behaviour, each with its own migration — no unused columns waiting on a feature.
export interface LinksTable {
  id: Generated<string>
  code: string
  originalUrl: string
  createdAt: Generated<Date>
}

export interface Database {
  links: LinksTable
}
