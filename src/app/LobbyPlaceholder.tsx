// ABOUTME: Stand-in for the lobby until it is built: links to the game picker and Host settings, plus the build version.
// ABOUTME: Restyles with the active lobby style through the theme tokens.
import packageInfo from '../../package.json'
import { href } from './useHashRoute'
import './LobbyPlaceholder.css'

export function LobbyPlaceholder() {
  return (
    <main className="lobby-placeholder">
      <h1 className="lobby-placeholder__logo">JuJu Studios</h1>
      <p className="lobby-placeholder__tagline">The lobby is being built. Here's what's ready to look at.</p>
      <nav className="lobby-placeholder__links" aria-label="Screens to preview">
        <a className="lobby-placeholder__button" href={href('picker')} data-testid="open-game-picker">
          Game picker
        </a>
        <a className="lobby-placeholder__button" href={href('settings')} data-testid="open-host-settings">
          Host settings
        </a>
        <a className="lobby-placeholder__button" href={href('practice', 'chainword')} data-testid="open-chainword-practice">
          Practice Chainword
        </a>
      </nav>
      <p className="lobby-placeholder__version" data-testid="app-version">
        v{packageInfo.version}
      </p>
    </main>
  )
}
