// ABOUTME: Vite build and dev server settings.
// ABOUTME: base matches the GitHub Pages path, flashfx21.github.io/juju-studios/.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/juju-studios/',
  plugins: [react()],
})
