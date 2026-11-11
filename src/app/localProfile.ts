// ABOUTME: The player's profile as this phone remembers it (username, initials, color, email), set on Join.
// ABOUTME: Stays on this device until profiles are saved to the backend; "Sign out of this phone" clears it.
import { PLAYER_COLOR_IDS, type PlayerColorId } from '../ui/playerColors'

export interface LocalProfile {
  username: string
  /** Up to 3 letters; 2-letter styles show the first two. */
  initials: string
  color: PlayerColorId
  email: string
}

const KEY = 'juju.profile'

export function loadProfile(): LocalProfile | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved.username !== 'string' || !PLAYER_COLOR_IDS.includes(saved.color)) return null
    return {
      username: saved.username,
      initials: typeof saved.initials === 'string' ? saved.initials : '',
      color: saved.color,
      email: typeof saved.email === 'string' ? saved.email : '',
    }
  } catch {
    return null
  }
}

export function saveProfile(profile: LocalProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // Storage blocked: the profile lasts only for this visit.
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored to clear.
  }
}
