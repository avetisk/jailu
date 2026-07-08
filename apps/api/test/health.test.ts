import { app } from "@jailu/api/src/app"
import { HTTP_STATUS } from "@jailu/shared"
import { describe, expect, it } from "vitest"

describe("GET /api/health", () => {
  it("returns a 200 with status ok", async () => {
    const res = await app.request("/api/health")

    expect(res.status).toBe(HTTP_STATUS.OK)
    await expect(res.json()).resolves.toEqual({ status: "ok" })
  })
})
