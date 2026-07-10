import type { Database } from "@jailu/api/lib/db/schema"
import type { Kysely } from "kysely"

export async function seed(db: Kysely<Database>): Promise<void> {
  await db.deleteFrom("shortLinks").execute()
  await db
    .insertInto("shortLinks")
    .values([
      { originalUrl: "http://localhost:3000/1", code: "0000001" },
      { originalUrl: "http://localhost:3000/2", code: "0000002" },
      { originalUrl: "http://localhost:3000/3", code: "0000003" },
    ])
    .execute()
}
