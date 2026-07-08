import { en } from "@jailu/web/src/i18n/locales/en"
import { fr } from "@jailu/web/src/i18n/locales/fr"
import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

// One i18next instance with bundled EN/FR catalogs (no async backend). The locale is
// browser-detected and cached in localStorage, falling back to English; there is no locale
// in the URL — the toggle switches at runtime (single-page app, per the Slice 2 design talk).
export const SUPPORTED_LNGS = ["en", "fr"] as const

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LNGS],
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
    interpolation: { escapeValue: false },
  })

export default i18n
