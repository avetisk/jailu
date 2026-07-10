import { sql, type Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("shortLinks")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn("originalUrl", "text", (col) => col.notNull())
    .addColumn("code", "char(7)", (col) => col.notNull().unique())
    .addColumn("createdAt", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("shortLinks").execute()
}
