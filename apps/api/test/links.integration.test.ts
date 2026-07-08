import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/db"
import { createMigrator } from "@/db/migrator"
import { findLinkByCode, insertLink } from "@/links/repository"

beforeAll(async () => {
  const { error } = await createMigrator().migrateToLatest()
  if (error) {
    throw error
  }
})

beforeEach(async () => {
  await db.deleteFrom("links").execute()
})

afterAll(async () => {
  await db.destroy()
})

describe("links repository (real Postgres)", () => {
  it("inserts a link under a minted code and finds it back", async () => {
    const link = await insertLink("https://example.com/")
    expect(link.code).toMatch(/^[A-Za-z0-9_-]{7}$/u)
    expect(link.originalUrl).toBe("https://example.com/")

    const found = await findLinkByCode(link.code)
    expect(found?.id).toBe(link.id)
    expect(found?.originalUrl).toBe("https://example.com/")
  })

  it("returns undefined for a code that does not exist", async () => {
    expect(await findLinkByCode("nolink1")).toBeUndefined()
  })
})
