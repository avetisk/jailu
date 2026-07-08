import { app } from "@jailu/api/src/app"
import { db } from "@jailu/api/src/db"
import { createMigrator } from "@jailu/api/src/db/migrator"
import { findLinkByCode, insertLink } from "@jailu/api/src/links/repository"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { z } from "zod"

const shortenResponse = z.object({
  linkCode: z.string(),
  url: z.string(),
  originalUrl: z.string(),
})

function postLink(url: string): Promise<Response> {
  return Promise.resolve(
    app.request("/api/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    }),
  )
}

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
    expect(link.linkCode).toMatch(/^[A-Za-z0-9_-]{7}$/u)
    expect(link.originalUrl).toBe("https://example.com/")

    const found = await findLinkByCode(link.linkCode)
    expect(found?.id).toBe(link.id)
    expect(found?.originalUrl).toBe("https://example.com/")
  })

  it("returns undefined for a code that does not exist", async () => {
    expect(await findLinkByCode("nolink1")).toBeUndefined()
  })
})

describe("links API (real Postgres)", () => {
  it("POST /api/links shortens a valid URL and GET /:linkCode redirects to it", async () => {
    const res = await postLink("https://example.com")
    expect(res.status).toBe(201)
    const body = shortenResponse.parse(await res.json())
    expect(body.linkCode).toMatch(/^[A-Za-z0-9_-]{7}$/u)
    expect(body.originalUrl).toBe("https://example.com/")

    const redirect = await app.request(`/${body.linkCode}`)
    expect(redirect.status).toBe(302)
    expect(redirect.headers.get("location")).toBe("https://example.com/")
  })

  it("POST /api/links rejects an invalid destination with 400", async () => {
    expect((await postLink("http://localhost")).status).toBe(400)
  })

  it("GET /:linkCode is 404 for an unknown code and a malformed one", async () => {
    expect((await app.request("/nolink1")).status).toBe(404)
    expect((await app.request("/has.dot")).status).toBe(404)
  })
})
