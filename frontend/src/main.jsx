import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "@fontsource-variable/syne/wght.css"
import "@fontsource-variable/sora/wght.css"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
