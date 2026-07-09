import { Button } from "@jailu/web/src/components/ui/button"
import { Input } from "@jailu/web/src/components/ui/input"
import { useState } from "react"
import { useTranslation } from "react-i18next"

// The success state: the minted short link (a readonly, selectable field), a copy-to-clipboard
// button, and a reset back to an empty form. `onReset` clears the mutation + form in the parent.
export function ShortResult({ url, onReset }: { url: string; onReset: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">{t("form.success_title")}</p>
      <div className="flex w-full items-center gap-2">
        <Input readOnly value={url} aria-label={t("form.success_title")} className="text-center" />
        <Button type="button" variant="outline" onClick={() => void handleCopy()}>
          {copied ? t("form.copied") : t("form.copy")}
        </Button>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        {t("form.reset")}
      </Button>
    </div>
  )
}
