import { App } from "@jailu/web/src/App"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const rootElement = document.getElementById("root")

if (rootElement === null) {
  throw new Error("Root element #root is missing from index.html")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
