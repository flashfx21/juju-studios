// ABOUTME: Holding page shown until the lobby exists: studio name, a way into Host settings, and the build version.
// ABOUTME: Restyles with the active lobby style through the theme tokens.
import packageInfo from '../../package.json'
import { routeHref } from './useHashRoute'
import './HoldingPage.css'

export function HoldingPage() {
  return (
    <main className="holding-page">
      <h1 className="holding-page__logo">JuJu Studios</h1>
      <p className="holding-page__tagline">Game night is being built. Check back soon.</p>
      <a className="holding-page__button" href={routeHref.settings} data-testid="open-host-settings">
        Host settings
      </a>
      <p className="holding-page__version" data-testid="app-version">
        v{packageInfo.version}
      </p>
    </main>
  )
}
