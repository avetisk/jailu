import type { Selectable } from "kysely"

import { db } from "@/db"
import type { LinksTable } from "@/db/schema"
import { withUniqueCode } from "@/links/unique-code"

export type Link = Selectable<LinksTable>

// Insert a link under a freshly minted, collision-retried code. The DB's unique index on
// `code` is the source of truth — we mint optimistically and let a violation trigger a
// retry rather than pre-checking (which would race).
export function insertLink(originalUrl: string): Promise<Link> {
  return withUniqueCode((code) =>
    db.insertInto("links").values({ code, originalUrl }).returningAll().executeTakeFirstOrThrow(),
  )
}

export function findLinkByCode(code: string): Promise<Link | undefined> {
  return db.selectFrom("links").selectAll().where("code", "=", code).executeTakeFirst()
}
