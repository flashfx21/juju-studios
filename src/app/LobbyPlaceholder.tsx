// ABOUTME: Stand-in for the lobby until it is built: the logo (with a home icon) goes home; links to the game picker, Host settings and Profile.
// ABOUTME: Restyles with the active lobby style through the theme tokens. Admin shows for admins; games are reached through the game picker.
import packageInfo from '../../package.json'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import './LobbyPlaceholder.css'

export function LobbyPlaceholder() {
  const me = useMe()
  const signedIn = me.kind === 'signed-in'
  const isAdmin = me.kind === 'signed-in' && me.isAdmin

  return (
    <main className="lobby-placeholder">
      <h1 className="lobby-placeholder__logo">
        <a className="lobby-placeholder__logo-link" href={href('home')} aria-label="JuJu Studios, home" data-testid="lobby-logo-home">
          <svg className="lobby-placeholder__home-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z" fill="currentColor" />
          </svg>
          JuJu Studios
        </a>
      </h1>
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
        <a className="lobby-placeholder__button lobby-placeholder__button--profile" href={href('profile')} data-testid="open-profile">
          Your profile
        </a>
        {isAdmin && (
          <a className="lobby-placeholder__button lobby-placeholder__button--admin" href={href('admin')} data-testid="open-admin">
            Admin
          </a>
        )}
        {!signedIn && (
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
