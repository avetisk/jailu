import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// The shadcn/ui class combiner: clsx for conditionals, tailwind-merge to dedupe conflicts.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
