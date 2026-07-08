import { describe, expect, it } from "vitest"

import { linkCodeSchema, hostSchema, portSchema, urlSchema } from "../src/index"

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

describe("urlSchema", () => {
  it("accepts and normalizes a public http(s) URL", () => {
    expect(urlSchema.parse("https://Example.COM")).toBe("https://example.com/")
    expect(urlSchema.parse("  http://sub.example.co.uk/a?b=1  ")).toBe(
      "http://sub.example.co.uk/a?b=1",
    )
    expect(urlSchema.parse("https://münchen.de")).toBe("https://xn--mnchen-3ya.de/")
  })

  it("rejects every conventional bad destination", () => {
    // Each entry is a distinct abuse/mistake class: empty, unparseable, over the length
    // cap, dangerous schemes (javascript/data/file), non-http(s), embedded credentials,
    // self-host loops, localhost, IPv4/IPv6/integer IP literals, and hosts with no real
    // public TLD (single label, one-char TLD, non-public TLD).
    const bad = [
      "",
      "not a url",
      `https://example.com/${"x".repeat(2048)}`,
      ["javascript", "alert(1)"].join(":"),
      "data:text/html,x",
      "file:///etc/passwd",
      "ftp://example.com",
      "http://user:pass@example.com",
      "http://:pass@example.com",
      "https://jai.lu/abc",
      "https://www.jai.lu/abc",
      "http://localhost",
      "http://api.localhost",
      "http://127.0.0.1",
      "http://[::1]",
      "http://2130706433",
      "http://example",
      "http://foo.b",
      "http://foo.internal",
      "http://service.local",
    ]
    for (const value of bad) {
      expect(urlSchema.safeParse(value).success, value).toBe(false)
    }
  })
})
