import { describe, expect, it } from "vitest"

import { loadConfig } from "@/config"

describe("loadConfig", () => {
  it("defaults and coerces the API port", () => {
    expect(loadConfig({}).api.port).toBe(3000)
    expect(loadConfig({ API_PORT: "8080" }).api.port).toBe(8080)
  })

  it("rejects an invalid port", () => {
    expect(() => loadConfig({ API_PORT: "-1" })).toThrow()
  })
})
