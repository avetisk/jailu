import { URL_ERROR } from "@jailu/shared"
import { en } from "@jailu/web/src/i18n/locales/en"
import { fr } from "@jailu/web/src/i18n/locales/fr"
import { describe, expect, it } from "vitest"

// The client owns localization of the shared validation error codes (ADR-0007). This guards the
// contract: every URL_ERROR code has a message in BOTH catalogs, and neither catalog carries an
// orphan url-error key. A new code with no translation — or a stale key — fails here.
const catalogs = { en, fr }

// Codes are "url.<leaf>"; the leaf is the key under errors.url in each catalog.
const expectedLeaves = new Set(Object.values(URL_ERROR).map((code) => code.replace(/^url\./u, "")))

describe("i18n error-code completeness", () => {
  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`${locale} covers exactly the URL_ERROR code set (no gaps, no orphans)`, () => {
      expect(new Set(Object.keys(catalog.errors.url))).toEqual(expectedLeaves)
    })

    it(`${locale} maps every code to a non-empty string`, () => {
      for (const message of Object.values(catalog.errors.url)) {
        expect(message, locale).toBeTypeOf("string")
        expect(message.length, locale).toBeGreaterThan(0)
      }
    })
  }
})
