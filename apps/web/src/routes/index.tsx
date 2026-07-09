import { LanguageToggle } from "@jailu/web/src/components/language-toggle"
import { ShortenForm } from "@jailu/web/src/components/shorten-form"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">{t("app.title")}</h1>
        <p className="text-muted-foreground">{t("app.tagline")}</p>
      </div>
      <div className="w-full max-w-md">
        <ShortenForm />
      </div>
    </main>
  )
}

export const Route = createFileRoute("/")({
  component: HomePage,
})
