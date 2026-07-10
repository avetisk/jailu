import { cn } from "@jailu/web/lib/utils"
import type { HTMLAttributes } from "react"

export const Form = ({ className, ...otherProps }: HTMLAttributes<HTMLFormElement>) => (
  <form className={cn("flex flex-col gap-4", className)} noValidate {...otherProps} />
)
