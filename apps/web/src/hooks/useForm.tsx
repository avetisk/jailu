import { zodResolver } from "@hookform/resolvers/zod"
import {
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
  useForm as useReactForm,
} from "react-hook-form"
import type { $ZodType, $ZodTypeInternals } from "zod/v4/core"

export const useForm = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues = TFieldValues,
>(
  schema: $ZodType<
    TTransformedValues,
    TFieldValues,
    $ZodTypeInternals<TTransformedValues, TFieldValues>
  >,
  options?: UseFormProps<TFieldValues, TContext, TTransformedValues>,
): UseFormReturn<TFieldValues, TContext, TTransformedValues> =>
  useReactForm({ resolver: zodResolver(schema), mode: "all", ...options })
