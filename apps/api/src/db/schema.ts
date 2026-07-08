import type { Generated } from "kysely"

// The columns the core shorten + redirect uses. camelCase end-to-end, quoted by kysely.
export interface LinksTable {
  id: Generated<string>
  linkCode: string
  originalUrl: string
  createdAt: Generated<Date>
}

export interface Database {
  links: LinksTable
}
