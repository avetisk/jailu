import { URL_ERROR } from "@jailu/shared/src/errors"
import {
  hostSchema,
  linkCodeSchema,
  portSchema,
  shortenableUrlSchema,
} from "@jailu/shared/src/schemas"
import { describe, expect, it } from "vitest"

describe("hostSchema", () => {
  it("accepts a non-empty host and rejects empty", () => {
    expect(hostSchema.safeParse("127.0.0.1").success).toBe(true)
    expect(hostSchema.safeParse("").success).toBe(false)
  })
})

describe("portSchema", () => {
  it("coerces a numeric string", () => {
    expect(portSchema.parse("3000")).toBe(3000)
  })

  it("rejects out-of-range and non-numeric ports", () => {
    for (const bad of ["0", "-1", "70000", "abc", "1.5"]) {
      expect(portSchema.safeParse(bad).success).toBe(false)
    }
  })
})

describe("linkCodeSchema", () => {
  it("accepts base64url codes in range", () => {
    for (const good of ["abc", "A1_-bc9", "z".repeat(64)]) {
      expect(linkCodeSchema.safeParse(good).success).toBe(true)
    }
  })

  it("rejects too-short, too-long, and non-base64url codes", () => {
    for (const bad of ["ab", "z".repeat(65), "has space", "with/slash", "dot.dot"]) {
      expect(linkCodeSchema.safeParse(bad).success).toBe(false)
    }
  })
})

describe("shortenableUrlSchema", () => {
  it("accepts and normalizes a public http(s) URL", () => {
    expect(shortenableUrlSchema.parse("https://Example.COM")).toBe("https://example.com/")
    expect(shortenableUrlSchema.parse("  http://sub.example.co.uk/a?b=1  ")).toBe(
      "http://sub.example.co.uk/a?b=1",
    )
    expect(shortenableUrlSchema.parse("https://münchen.de")).toBe("https://xn--mnchen-3ya.de/")
  })

  it("rejects every conventional bad destination with its stable error code", () => {
    // Each entry pairs a distinct abuse/mistake class with the code the schema must emit
    // (as the zod issue `message` — the client localizes it, the API returns it verbatim).
    const cases: [string, string][] = [
      ["", URL_ERROR.EMPTY],
      ["   ", URL_ERROR.EMPTY],
      [`https://example.com/${"x".repeat(2048)}`, URL_ERROR.TOO_LONG],
      ["not a url", URL_ERROR.MALFORMED],
      [["javascript", "alert(1)"].join(":"), URL_ERROR.SCHEME_NOT_ALLOWED],
      ["data:text/html,x", URL_ERROR.SCHEME_NOT_ALLOWED],
      ["file:///etc/passwd", URL_ERROR.SCHEME_NOT_ALLOWED],
      ["ftp://example.com", URL_ERROR.SCHEME_NOT_ALLOWED],
      ["http://user:pass@example.com", URL_ERROR.CREDENTIALS_PRESENT],
      ["http://:pass@example.com", URL_ERROR.CREDENTIALS_PRESENT],
      ["https://jai.lu/abc", URL_ERROR.SELF_HOST],
      ["https://www.jai.lu/abc", URL_ERROR.SELF_HOST],
      ["http://localhost", URL_ERROR.LOCALHOST],
      ["http://api.localhost", URL_ERROR.LOCALHOST],
      ["http://127.0.0.1", URL_ERROR.IP_HOST],
      ["http://[::1]", URL_ERROR.IP_HOST],
      ["http://2130706433", URL_ERROR.IP_HOST],
      ["http://example", URL_ERROR.NO_PUBLIC_TLD],
      ["http://foo.b", URL_ERROR.NO_PUBLIC_TLD],
      ["http://foo.internal", URL_ERROR.NO_PUBLIC_TLD],
      ["http://service.local", URL_ERROR.NO_PUBLIC_TLD],
    ]
    for (const [value, code] of cases) {
      const result = shortenableUrlSchema.safeParse(value)
      expect(result.success, value).toBe(false)
      // Exactly one issue per failure, carrying the stable code.
      expect(
        result.error?.issues.map((issue) => issue.message),
        value,
      ).toEqual([code])
    }
  })
})
