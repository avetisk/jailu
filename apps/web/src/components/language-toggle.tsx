import { Button } from "@jailu/web/src/components/ui/button"
import { SUPPORTED_LNGS } from "@jailu/web/src/i18n"
import { useTranslation } from "react-i18next"

// Cycles the active locale through the supported set. Exercises the whole styling + i18n
// pipeline (a shadcn Button that flips every translated string) until the real UI arrives.
export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  function nextLanguage() {
    const index = SUPPORTED_LNGS.findIndex((lng) => lng === current)
    const next = SUPPORTED_LNGS[(index + 1) % SUPPORTED_LNGS.length]
    void i18n.changeLanguage(next)
  }

  return (
    <Button variant="outline" size="sm" onClick={nextLanguage} aria-label={t("app.language")}>
      {current.toUpperCase()}
    </Button>
  )
}
