import { loadConfig } from "@jailu/api/src/config"
import { describe, expect, it } from "vitest"

const validEnv = {
  API_HOST: "127.0.0.1",
  API_PORT: "3000",
  DATABASE_URL: "postgres://jailu:jailu@127.0.0.1:5432/jailu",
  PUBLIC_BASE_URL: "http://localhost:5173",
}

describe("loadConfig", () => {
  it("parses the environment into a nested, coerced config", () => {
    expect(loadConfig(validEnv)).toEqual({
      api: { host: "127.0.0.1", port: 3000 },
      database: { url: "postgres://jailu:jailu@127.0.0.1:5432/jailu" },
      publicBaseUrl: "http://localhost:5173",
    })
  })

  it("fails loud when a required variable is missing — no defaults", () => {
    expect(() => loadConfig({})).toThrow()
    expect(() => loadConfig({ API_PORT: "3000", DATABASE_URL: validEnv.DATABASE_URL })).toThrow()
    expect(() => loadConfig({ API_HOST: "127.0.0.1", API_PORT: "3000" })).toThrow()
    expect(() =>
      loadConfig({
        API_HOST: validEnv.API_HOST,
        API_PORT: validEnv.API_PORT,
        DATABASE_URL: validEnv.DATABASE_URL,
      }),
    ).toThrow()
  })

  it("rejects an invalid port", () => {
    expect(() => loadConfig({ ...validEnv, API_PORT: "-1" })).toThrow()
    expect(() => loadConfig({ ...validEnv, API_PORT: "70000" })).toThrow()
  })

  it("rejects a public base URL that is not an http(s) URL", () => {
    expect(() => loadConfig({ ...validEnv, PUBLIC_BASE_URL: "api:3000" })).toThrow()
    expect(() => loadConfig({ ...validEnv, PUBLIC_BASE_URL: "ftp://jai.lu" })).toThrow()
  })
})
