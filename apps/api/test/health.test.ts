import { describe, expect, it } from "vitest"

import { app } from "@/app"

describe("GET /api/health", () => {
  it("returns a 200 with status ok", async () => {
    const res = await app.request("/api/health")

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ status: "ok" })
  })
})
