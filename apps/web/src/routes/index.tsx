import { LanguageToggle } from "@jailu/web/src/components/language-toggle"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">{t("app.title")}</h1>
      <p className="text-muted-foreground">{t("app.tagline")}</p>
    </main>
  )
}

export const Route = createFileRoute("/")({
  component: HomePage,
})
