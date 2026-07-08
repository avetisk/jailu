import type { Selectable } from "kysely"

import { db } from "@/db"
import type { LinksTable } from "@/db/schema"
import { withUniqueCode } from "@/links/unique-code"

export type ShortLink = Selectable<LinksTable>

// Insert a link under a freshly minted, collision-retried code. The DB's unique index on
// `linkCode` is the source of truth — we mint optimistically and let a violation trigger a
// retry rather than pre-checking (which would race).
export function insertLink(originalUrl: string): Promise<ShortLink> {
  return withUniqueCode((linkCode) =>
    db
      .insertInto("links")
      .values({ linkCode, originalUrl })
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export function findLinkByCode(linkCode: string): Promise<ShortLink | undefined> {
  return db.selectFrom("links").selectAll().where("linkCode", "=", linkCode).executeTakeFirst()
}
