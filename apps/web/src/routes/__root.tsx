import { Outlet, createRootRoute } from "@tanstack/react-router"

// Root layout. Just an <Outlet /> for now; shared chrome (header, nav) lands here as pages grow.
function RootLayout() {
  return <Outlet />
}

export const Route = createRootRoute({
  component: RootLayout,
})
