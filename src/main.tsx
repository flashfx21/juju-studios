// ABOUTME: Browser entry point: loads the theme tokens and base styles, then mounts the app.
// ABOUTME: The active lobby style is set by data-theme on <html> in index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/themes/themes.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
