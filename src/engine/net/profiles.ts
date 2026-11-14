// ABOUTME: Saved player profiles (username, color, symbol, initials, lobby style) at profiles/{uid} in the Realtime Database.
// ABOUTME: Any verified player reads them all (for the leaderboard); each writes only their own. The email stays in sign-in.

import { onValue, ref, set, update } from 'firebase/database'
import { PLAYER_COLOR_IDS, type PlayerColorId } from '../../ui/playerColors'
import { isPlayerSymbolId, type PlayerSymbolId } from '../../ui/playerSymbols'
import { isLobbyStyleId, type LobbyStyleId } from '../../ui/themes/lobbyStyles'
import { firebaseBackend } from './firebase'

export interface Profile {
  username: string
  /** Up to 3 letters; 2-letter styles show the first two. */
  initials: string
  color: PlayerColorId
  /** The animal or object shown with the color ("red wolf"). Missing on profiles made before symbols. */
  symbol?: PlayerSymbolId
  /** The lobby style this player sees on any device. Missing until they pick one. */
  style?: LobbyStyleId
}

function profileRef(uid: string) {
  return ref(firebaseBackend().database, `profiles/${uid}`)
}

/** A stored value as a Profile, or null when it is missing or not shaped like one. */
export function asProfile(value: unknown): Profile | null {
  if (!value || typeof value !== 'object') return null
  const { username, initials, color, symbol, style } = value as Record<string, unknown>
  if (typeof username !== 'string' || typeof initials !== 'string') return null
  if (!PLAYER_COLOR_IDS.includes(color as PlayerColorId)) return null
  const profile: Profile = { username, initials, color: color as PlayerColorId }
  if (isPlayerSymbolId(symbol)) profile.symbol = symbol
  if (isLobbyStyleId(style)) profile.style = style
  return profile
}

/** Calls back with this player's profile (null if they have none yet), and again on every change. Returns a stop function. */
export function watchProfile(
  uid: string,
  onChange: (profile: Profile | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(profileRef(uid), (snapshot) => onChange(asProfile(snapshot.val())), onError)
}

/** Every saved profile by uid, kept up to date. Returns a stop function. */
export function watchProfiles(onChange: (profiles: Record<string, Profile>) => void, onError: (error: Error) => void): () => void {
  return onValue(
    ref(firebaseBackend().database, 'profiles'),
    (snapshot) => {
      // Anything under profiles that is not shaped like a profile (say, a hand-made console entry) is left out.
      const profiles: Record<string, Profile> = {}
      for (const [uid, value] of Object.entries(snapshot.val() ?? {})) {
        const profile = asProfile(value)
        if (profile) profiles[uid] = profile
      }
      onChange(profiles)
    },
    onError,
  )
}

/** Saves the given fields; any left out (such as the style) keep their saved value. */
export function saveProfile(uid: string, profile: Profile): Promise<void> {
  return update(profileRef(uid), profile)
}

export function saveProfileStyle(uid: string, style: LobbyStyleId): Promise<void> {
  return set(ref(firebaseBackend().database, `profiles/${uid}/style`), style)
}
