import { shortenableUrlSchema } from "@jailu/common/schemas"
import { Form } from "@jailu/web/components/Form"
import { FormFieldError } from "@jailu/web/components/FormFieldError"
import { ShortLink } from "@jailu/web/components/ShortLink"
import { SubmitFormButton } from "@jailu/web/components/SubmitFormButton"
import { Button } from "@jailu/web/components/ui/button"
import { Input } from "@jailu/web/components/ui/input"
import { useForm } from "@jailu/web/hooks/useForm"
import { apiClient } from "@jailu/web/lib/apiClient"
import { cn } from "@jailu/web/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const formSchema = z.object({ originalUrl: shortenableUrlSchema })

type FormSchema = z.infer<typeof formSchema>

// oxlint-disable-next-line max-lines-per-function
const IndexPage = () => {
  const mutation = useMutation({
    mutationFn: async ({ originalUrl }: FormSchema) => {
      const res = await apiClient.shortLinks.$post({ json: { originalUrl } })

      if (!res.ok) {
        throw new Error("Something went wrong. Try again later.")
      }

      return res.json()
    },
  })
  const { formState, handleSubmit, register, reset: formReset } = useForm(formSchema)
  const onSubmit = handleSubmit(async ({ originalUrl }) => {
    await mutation.mutateAsync({ originalUrl })
  })
  const handleReset = () => {
    mutation.reset()
    formReset()
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 p-8">
      <Form className="flex min-w-xs flex-col items-end gap-4" onSubmit={onSubmit}>
        <div className="flex w-full flex-col gap-4 rounded-sm border p-4 shadow-2xl">
          <header className="flex flex-col gap-1">
            <h1 className="font-mono text-lg font-semibold text-zinc-800">jai.lu</h1>
            <p className="pb-2 text-xs text-zinc-500">Life&apos;s too short to for long URLs</p>
          </header>
          {mutation.isSuccess && <ShortLink code={mutation.data.code} />}
          {
            <Input
              placeholder="https://longest.url/in/the/whole/univers"
              className={cn("w-full", mutation.isSuccess && "hidden")}
              disabled={formState.isSubmitting}
              {...register("originalUrl")}
            />
          }
          <FormFieldError error={formState.errors.originalUrl?.message} />
        </div>
        {mutation.isSuccess ? (
          <Button
            variant="outline"
            type="button"
            className="mr-4 ml-auto shadow-2xl"
            onClick={handleReset}
          >
            Try another one
          </Button>
        ) : (
          <SubmitFormButton
            className="mr-4 ml-auto shadow-2xl"
            isDirty={formState.isDirty}
            isSubmitting={formState.isSubmitting}
            isValid={formState.isValid}
          >
            Make it short
          </SubmitFormButton>
        )}
      </Form>
    </div>
  )
}

export const Route = createFileRoute("/")({ component: IndexPage })
