import { getShortLinkFromCode } from "@jailu/web/business/shortLinks/getShortLinkFromCode"
import { Button } from "@jailu/web/components/ui/button"
import { copyToClipboard } from "@jailu/web/lib/copyToClipboard"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

export const ShortLink = ({ code }: { code: string }) => {
  const handleCopy = (data: string) => async () => {
    if (!data) {
      return
    }

    await copyToClipboard(getShortLinkFromCode(data))
    toast("Copied!")
  }

  return (
    <div className="flex items-center justify-between rounded-sm border bg-zinc-50 px-2 py-1 text-xs">
      <span>{getShortLinkFromCode(code)}</span>
      <Button variant="ghost" size="icon-xs" onClick={handleCopy(code)}>
        <CopyIcon />
      </Button>
    </div>
  )
}
