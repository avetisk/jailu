import { generateCode } from "@/lib/code"

const MAX_ATTEMPTS = 5
// Postgres unique_violation SQLSTATE — a code collided with the unique index.
const UNIQUE_VIOLATION = "23505"

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  )
}

// Run `attempt` with freshly minted codes, retrying only on a unique-code collision.
// 64^7 makes a collision astronomically rare, so a handful of tries is plenty; any other
// error propagates immediately. `generate` is injectable so the retry paths are unit
// testable without forcing a real DB collision.
export async function withUniqueCode<T>(
  attempt: (code: string) => Promise<T>,
  generate: () => string = generateCode,
): Promise<T> {
  let lastError: unknown = null
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    try {
      // Retries are inherently sequential — each depends on the previous collision.
      // eslint-disable-next-line no-await-in-loop
      return await attempt(generate())
    } catch (error) {
      if (!isUniqueViolation(error)) {
        // Propagate a non-collision error unchanged.
        // eslint-disable-next-line no-throw-literal
        throw error
      }
      lastError = error
    }
  }
  throw new Error("could not mint a unique code after retries", { cause: lastError })
}
