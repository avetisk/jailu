import { routeTree } from "@jailu/web/src/routeTree.gen"
import { createRouter } from "@tanstack/react-router"

export const router = createRouter({ routeTree })

// Register the router instance so route ids, params, and search are typed project-wide.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
