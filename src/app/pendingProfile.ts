// ABOUTME: Holds the profile typed on Join while the sign-in link is on its way, so it can be saved once signed in.
// ABOUTME: Kept on this device (localStorage); if the link opens in another browser, profile setup asks again.
import type { Profile } from '../engine/net/profiles'
import { PLAYER_COLOR_IDS } from '../ui/playerColors'

const KEY = 'juju.pendingProfile'

export function savePendingProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // Storage blocked: profile setup asks for it after sign-in.
  }
}

export function loadPendingProfile(): Profile | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved.username !== 'string' || typeof saved.initials !== 'string') return null
    return PLAYER_COLOR_IDS.includes(saved.color) ? saved : null
  } catch {
    return null
  }
}

export function clearPendingProfile() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored to clear.
  }
}
