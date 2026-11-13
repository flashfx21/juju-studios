// ABOUTME: Browser entry point: loads the theme tokens and base styles, then mounts the app.
// ABOUTME: The active lobby style is set by data-theme on <html> in index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/themes/themes.css'
import './index.css'
import App from './App.tsx'
import { isEmailSignInLink } from './engine/net/auth'
import { href } from './app/useHashRoute'

// A sign-in link from the email opens the site's front page; send it to the step that finishes signing in.
if (new URLSearchParams(window.location.search).get('mode') === 'signIn' && isEmailSignInLink(window.location.href)) {
  window.history.replaceState(null, '', window.location.pathname + window.location.search + href('sign-in', 'finish'))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
