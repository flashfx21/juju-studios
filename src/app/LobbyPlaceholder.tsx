// ABOUTME: Stand-in for the lobby until it is built: who is signed in, links to the game picker, Host settings, Profile and Solo play, plus the version.
// ABOUTME: Restyles with the active lobby style through the theme tokens. Solo play shows only when signed in.
import packageInfo from '../../package.json'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import './LobbyPlaceholder.css'

export function LobbyPlaceholder() {
  const me = useMe()
  const signedIn = me.kind === 'signed-in'

  return (
    <main className="lobby-placeholder">
      <h1 className="lobby-placeholder__logo">JuJu Studios</h1>
      <p className="lobby-placeholder__tagline">The lobby is being built. Here's what's ready to look at.</p>
      <p className="lobby-placeholder__tagline" data-testid="lobby-signed-in">
        {me.kind === 'signed-in'
          ? `Signed in as ${me.profile?.username ?? me.player.email}`
          : me.kind === 'signed-out'
            ? 'Not signed in'
            : ''}
      </p>
      <nav className="lobby-placeholder__links" aria-label="Screens to preview">
        <a className="lobby-placeholder__button" href={href('picker')} data-testid="open-game-picker">
          Game picker
        </a>
        <a className="lobby-placeholder__button" href={href('settings')} data-testid="open-host-settings">
          Host settings
        </a>
        <a className="lobby-placeholder__button" href={href('profile')} data-testid="open-profile">
          Your profile
        </a>
        {signedIn ? (
          <a className="lobby-placeholder__button" href={href('playtest')} data-testid="open-solo-play">
            Solo play
          </a>
        ) : (
          <a className="lobby-placeholder__button" href={href('sign-in')} data-testid="open-sign-in">
            Sign in
          </a>
        )}
      </nav>
      <p className="lobby-placeholder__version" data-testid="app-version">
        v{packageInfo.version}
      </p>
    </main>
  )
}
