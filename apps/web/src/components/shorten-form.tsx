import { shortenableUrlSchema } from "@jailu/shared"
import { ShortResult } from "@jailu/web/src/components/short-result"
import { Button } from "@jailu/web/src/components/ui/button"
import { Input } from "@jailu/web/src/components/ui/input"
import { client } from "@jailu/web/src/lib/rpc"
import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

type ShortenResult = { linkCode: string; url: string; originalUrl: string }

// The POST /api/links call through the typed RPC client. A non-2xx becomes a thrown code the
// generic error message renders; success carries the minted link. react-query owns the lifecycle.
function useShortenMutation() {
  return useMutation<ShortenResult, Error, string>({
    mutationFn: async (url) => {
      const res = await client.api.links.$post({ json: { url } })
      if (!res.ok) {
        throw new Error("request_failed")
      }
      return res.json()
    },
  })
}

// The URL input + its inline validation message. Errors carry a URL_ERROR code in `message`
// (the shared schema, ADR-0007); the catalog turns the code into localized prose.
function UrlField({ field }: { field: AnyFieldApi }) {
  const { t } = useTranslation()
  const code = field.state.meta.errors[0]?.message ?? null

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={field.name} className="sr-only">
        {t("form.url_label")}
      </label>
      <Input
        id={field.name}
        name={field.name}
        type="url"
        inputMode="url"
        autoComplete="off"
        aria-invalid={code !== null}
        placeholder={t("form.url_placeholder")}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      />
      {code === null ? null : (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${code}`)}
        </p>
      )}
    </div>
  )
}

// Slice 2d: the shorten form. Field validation reuses the shared shortenableUrlSchema; the same
// schema runs on the server, so a URL that passes here passes there — the API is the backstop.
export function ShortenForm() {
  const { t } = useTranslation()
  const mutation = useShortenMutation()

  const form = useForm({
    defaultValues: { url: "" },
    onSubmit: ({ value }) => {
      mutation.mutate(value.url)
    },
  })

  const handleReset = () => {
    mutation.reset()
    form.reset()
  }

  if (mutation.isSuccess) {
    return <ShortResult url={mutation.data.url} onReset={handleReset} />
  }

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="url" validators={{ onChange: shortenableUrlSchema }}>
        {(field) => <UrlField field={field} />}
      </form.Field>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t("form.submitting") : t("form.submit")}
      </Button>
      {mutation.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {t("errors.request_failed")}
        </p>
      ) : null}
    </form>
  )
}
