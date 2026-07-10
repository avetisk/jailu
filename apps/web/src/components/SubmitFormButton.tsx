import { Button } from "@jailu/web/components/ui/button"
import { Spinner } from "@jailu/web/components/ui/spinner"
import type { HTMLAttributes } from "react"

export const SubmitFormButton = ({
  isDirty,
  isSubmitting,
  isValid,
  children,
  ...otherProps
}: {
  isDirty: boolean
  isSubmitting: boolean
  isValid: boolean
} & HTMLAttributes<HTMLButtonElement>) => (
  <Button type="submit" size="lg" disabled={isSubmitting || !isDirty || !isValid} {...otherProps}>
    {isSubmitting && <Spinner />} {children}
  </Button>
)
