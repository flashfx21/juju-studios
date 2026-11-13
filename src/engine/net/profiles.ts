// ABOUTME: Saved player profiles (username, color, symbol, initials, lobby style) at profiles/{uid} in the Realtime Database.
// ABOUTME: Each player reads and writes only their own; the email stays in sign-in, never in the profile.

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

/** Saves the given fields; any left out (such as the style) keep their saved value. */
export function saveProfile(uid: string, profile: Profile): Promise<void> {
  return update(profileRef(uid), profile)
}

export function saveProfileStyle(uid: string, style: LobbyStyleId): Promise<void> {
  return set(ref(firebaseBackend().database, `profiles/${uid}/style`), style)
}
