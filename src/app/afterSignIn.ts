// ABOUTME: Where to go once signing in finishes, such as back to Join's code screen after a sign-up from Join.
// ABOUTME: Kept on this device (localStorage) so it survives the email link opening a new tab; used once.
import type { Screen } from './useHashRoute'

const KEY = 'juju.afterSignIn'
const PLACES: Screen[] = ['join', 'lobby']

export function saveAfterSignIn(screen: Screen) {
  try {
    localStorage.setItem(KEY, screen)
  } catch {
    // Storage blocked: sign-in ends on the lobby page instead.
  }
}

/** The saved place (then forgotten), or the lobby page when nothing was saved. */
export function takeAfterSignIn(): Screen {
  try {
    const saved = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    return PLACES.find((place) => place === saved) ?? 'lobby'
  } catch {
    return 'lobby'
  }
}
