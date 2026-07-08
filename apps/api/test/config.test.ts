import { loadConfig } from "@jailu/api/src/config"
import { describe, expect, it } from "vitest"

const validEnv = {
  API_HOST: "127.0.0.1",
  API_PORT: "3000",
  DATABASE_URL: "postgres://jailu:jailu@127.0.0.1:5432/jailu",
}

describe("loadConfig", () => {
  it("parses the environment into a nested, coerced config", () => {
    expect(loadConfig(validEnv)).toEqual({
      api: { host: "127.0.0.1", port: 3000 },
      database: { url: "postgres://jailu:jailu@127.0.0.1:5432/jailu" },
    })
  })

  it("fails loud when a required variable is missing — no defaults", () => {
    expect(() => loadConfig({})).toThrow()
    expect(() => loadConfig({ API_PORT: "3000", DATABASE_URL: validEnv.DATABASE_URL })).toThrow()
    expect(() => loadConfig({ API_HOST: "127.0.0.1", API_PORT: "3000" })).toThrow()
  })

  it("rejects an invalid port", () => {
    expect(() => loadConfig({ ...validEnv, API_PORT: "-1" })).toThrow()
    expect(() => loadConfig({ ...validEnv, API_PORT: "70000" })).toThrow()
  })
})
