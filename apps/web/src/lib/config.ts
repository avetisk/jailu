import z from "zod"

export const config = z
  .object({
    API_BASE_URL: z.url(),
  })
  .transform(({ API_BASE_URL }) => ({
    api: {
      baseUrl: API_BASE_URL,
    },
  }))
  .parse({
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  })
